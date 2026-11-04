/**
 * Integration test: the REAL DBService code against the Firestore + Auth emulators,
 * with the REAL firestore.rules. Run: npm run test:rules
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../src/lib/firebase/client';
import { DBService } from '../src/lib/firebase/db';
import { parsePickupQr, encodePickupQr } from '../src/lib/qr';

const PW = 'password123';
const uids: Record<string, string> = {};

async function signup(name: string, extra: Record<string, unknown> = {}) {
    const cred = await createUserWithEmailAndPassword(auth, `${name}@t.test`, PW);
    uids[name] = cred.user.uid;
    await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, name, email: `${name}@t.test`, avatar: '', coins: 100, xp: 0, level: 1,
        levelTitle: 'Seedling', itemsTraded: 0, co2Saved: 0, badges: [], ...extra
    });
}
const login = (name: string) => signInWithEmailAndPassword(auth, `${name}@t.test`, PW);
const rejects = async (p: Promise<unknown>, msg: string) => { let threw = false; try { await p; } catch { threw = true; } assert.ok(threw, `expected failure: ${msg}`); };

let admin: (fn: () => Promise<void>) => Promise<void>;

before(async () => {
    await signup('seller'); await signup('buyer'); await signup('buyer2'); await signup('owner'); await signup('mallory');
    await signup('worker');
    // Roles can't be self-assigned: simulate the console by writing with rules disabled via REST.
    await setRole(uids.worker, 'worker');
});

async function setRole(uid: string, role: string) {
    const host = process.env.FIRESTORE_EMULATOR_HOST!;
    const r = await fetch(`http://${host}/v1/projects/demo-reloop/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=role`, {
        method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { role: { stringValue: role } } })
    });
    assert.ok(r.ok, 'set role: ' + (await r.text()));
}

async function mkListing(sellerName: string, title = 'Desk Lamp', price = 40) {
    await login(sellerName);
    const id = await DBService.createListing({
        title, description: 'd', price, condition: 'Good', category: 'furniture', images: [], status: 'available',
        seller: { id: uids[sellerName], name: sellerName }
    } as never);
    return (await DBService.getListingById(id))!;
}
const coins = async (n: string) => (await getDoc(doc(db, 'users', uids[n]))).data()!.coins as number;

test('users cannot grant themselves a role or steal coins', async () => {
    await login('mallory');
    await rejects(updateDoc(doc(db, 'users', uids.mallory), { role: 'admin' }), 'self role');
    await rejects(updateDoc(doc(db, 'users', uids.mallory), { coins: 100000 }), 'huge self credit');
    await rejects(updateDoc(doc(db, 'users', uids.buyer), { coins: 0 }), 'edit other user');
});

test('listing with a 3-char title can be created (old rules rejected it)', async () => {
    const l = await mkListing('seller', 'Pen', 5);
    assert.equal(l.title, 'Pen');
});

test('full trade: offer -> accept -> buyer QR -> seller verifies -> coins move once', async () => {
    const listing = await mkListing('seller', 'Study Table', 60);
    await login('buyer');
    const { tradeId } = await DBService.makeOffer({ listing, buyer: { uid: uids.buyer, name: 'buyer' }, coins: 60 });
    await rejects(DBService.makeOffer({ listing, buyer: { uid: uids.buyer, name: 'buyer' }, coins: 60 }), 'duplicate offer');

    // buyer cannot accept their own offer
    await rejects(DBService.acceptTrade({ tradeId, sellerId: uids.buyer }), 'buyer accepts');

    await login('seller');
    await DBService.acceptTrade({ tradeId, sellerId: uids.seller });
    assert.equal((await DBService.getListingById(listing.id))!.status, 'pending');
    await rejects(DBService.acceptTrade({ tradeId, sellerId: uids.seller }), 'double accept');

    // seller cannot read the pickup secret, nor complete with a guessed code
    await login('buyer');
    const code = await DBService.getOrCreatePickupSecret(tradeId, uids.buyer);
    assert.match(code, /^[A-Z0-9]{8}$/);
    assert.equal(await DBService.getOrCreatePickupSecret(tradeId, uids.buyer), code, 'stable code');
    const parsed = parsePickupQr(encodePickupQr(tradeId, code))!;
    assert.deepEqual(parsed, { tradeId, code });

    await login('seller');
    await rejects(getDoc(doc(db, 'trades', tradeId, 'secrets', 'pickup')).then(s => { if (!s.exists()) throw 0; return s; }), 'seller reads secret');
    await rejects(DBService.completeTrade({ tradeId, code: 'AAAAAAAA', sellerId: uids.seller }), 'wrong code');
    assert.equal(await coins('seller'), 100); assert.equal(await coins('buyer'), 100);

    // a stranger cannot complete even with the right code
    await login('mallory');
    await rejects(DBService.completeTrade({ tradeId, code, sellerId: uids.mallory }), 'stranger completes');

    await login('seller');
    const res = await DBService.completeTrade({ tradeId, code, sellerId: uids.seller });
    assert.equal(res.coins, 60);
    assert.equal(await coins('seller'), 160); assert.equal(await coins('buyer'), 40);
    assert.equal((await DBService.getListingById(listing.id))!.status, 'sold');

    // replay is impossible
    await rejects(DBService.completeTrade({ tradeId, code, sellerId: uids.seller }), 'replay');
    assert.equal(await coins('seller'), 160);
});

test('offer needs funds; two offers, only one accepted, other auto-declined', async () => {
    const listing = await mkListing('seller', 'Chair', 30);
    await login('buyer2');
    await rejects(DBService.makeOffer({ listing, buyer: { uid: uids.buyer2, name: 'b2' }, coins: 9999 }), 'too poor');
    const t1 = (await DBService.makeOffer({ listing, buyer: { uid: uids.buyer2, name: 'b2' }, coins: 30 })).tradeId;
    await login('mallory');
    const t2 = (await DBService.makeOffer({ listing, buyer: { uid: uids.mallory, name: 'm' }, coins: 31 })).tradeId;
    await login('seller');
    await DBService.acceptTrade({ tradeId: t1, sellerId: uids.seller });
    assert.equal((await getDoc(doc(db, 'trades', t2))).data()!.status, 'declined');
    await rejects(DBService.acceptTrade({ tradeId: t2, sellerId: uids.seller }), 'accept loser');
});

test('seller can cancel an accepted deal and the item returns to the marketplace', async () => {
    const listing = await mkListing('seller', 'Fan', 20);
    await login('buyer2');
    const { tradeId } = await DBService.makeOffer({ listing, buyer: { uid: uids.buyer2, name: 'b2' }, coins: 20 });
    await login('seller');
    await DBService.acceptTrade({ tradeId, sellerId: uids.seller });
    await DBService.cancelAcceptedTrade(tradeId, uids.seller);
    assert.equal((await DBService.getListingById(listing.id))!.status, 'available');
});

test('smart bag: register, fill, worker scans+collects, owner paid once', async () => {
    await login('owner');
    await rejects(DBService.createSmartBag({ qrCode: 'https://evil.example', userId: uids.owner }), 'bad qr');
    const id = await DBService.createSmartBag({ qrCode: ' bag-test01 ', userId: uids.owner, ownerName: 'owner' });
    assert.equal(id, 'BAG-TEST01');
    await login('mallory');
    await rejects(DBService.createSmartBag({ qrCode: 'BAG-TEST01', userId: uids.mallory }), 'duplicate registration');
    await rejects(DBService.markBagFilled(id, uids.mallory), 'non-owner fills');

    await login('worker');
    await rejects(DBService.collectSmartBag(id, uids.worker, 2), 'collect before filled');

    await login('owner');
    await DBService.markBagFilled(id, uids.owner);
    await rejects(DBService.markBagFilled(id, uids.owner), 'fill twice');

    await login('mallory'); // not staff
    await rejects(DBService.collectSmartBag(id, uids.mallory, 5), 'non-staff collects');
    await login('owner');
    await rejects(DBService.collectSmartBag(id, uids.owner, 5), 'owner collects own bag');

    await login('worker');
    const found = await DBService.getSmartBagByQR('bag-test01');
    assert.equal(found.id, id);
    await rejects(DBService.collectSmartBag(id, uids.worker, 0), 'zero weight');
    await rejects(DBService.collectSmartBag(id, uids.worker, 51), 'over max weight');
    const before = await coins('owner');
    const r = await DBService.collectSmartBag(id, uids.worker, 2.5);
    assert.equal(r.coinsAwarded, 25);
    assert.equal(await coins('owner'), before + 25);
    const bag = (await getDoc(doc(db, 'smartBags', id))).data()!;
    assert.equal(bag.status, 'processed'); assert.equal(bag.collectedBy, uids.worker);
    await rejects(DBService.collectSmartBag(id, uids.worker, 2.5), 'collect twice');
    assert.equal(await coins('owner'), before + 25);
});

test('worker material pricing is honoured but capped at 25 coins/kg', async () => {
    await login('owner');
    const id = await DBService.createSmartBag({ qrCode: 'BAG-TEST02', userId: uids.owner });
    await DBService.markBagFilled(id, uids.owner);
    await login('worker');
    await rejects(DBService.collectSmartBag(id, uids.worker, 2, { coins: 51 }), 'over-cap payout');
    const r = await DBService.collectSmartBag(id, uids.worker, 2, { coins: 50, materials: ['metal'] });
    assert.equal(r.coinsAwarded, 50);
});

test('staff (zone worker) can complete a trade with the buyer QR code', async () => {
    const listing = await mkListing('seller', 'Kettle', 25);
    await login('buyer');
    const { tradeId } = await DBService.makeOffer({ listing, buyer: { uid: uids.buyer, name: 'b' }, coins: 25 });
    await login('seller');
    await DBService.acceptTrade({ tradeId, sellerId: uids.seller });
    await login('buyer');
    const code = await DBService.getOrCreatePickupSecret(tradeId, uids.buyer);
    const [b0, s0] = [await coins('buyer'), await coins('seller')];
    await login('worker');
    await DBService.completeTrade({ tradeId, code, sellerId: uids.worker });
    await login('buyer'); assert.equal(await coins('buyer'), b0 - 25);
    assert.equal(await coins('seller'), s0 + 25);
});

test('rewards: price comes from the reward, not the client', async () => {
    const host = process.env.FIRESTORE_EMULATOR_HOST!;
    await fetch(`http://${host}/v1/projects/demo-reloop/databases/(default)/documents/rewards/r1`, {
        method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { title: { stringValue: 'Coffee' }, cost: { integerValue: '30' }, isActive: { booleanValue: true } } })
    });
    await login('buyer2');
    const b = await coins('buyer2');
    const r = await DBService.redeemReward(uids.buyer2, 'r1');
    assert.ok(r.success, r.error); assert.match(r.code!, /^RL-/);
    assert.equal(await coins('buyer2'), b - 30);
    const bad = await DBService.redeemReward(uids.buyer2, 'nope');
    assert.equal(bad.success, false);
});

test('unrelated users cannot read trades; missions work for the owner only', async () => {
    await login('mallory');
    await rejects(getDocs(query(collection(db, 'trades'), where('sellerId', '==', uids.seller))), 'list others trades');
    await login('buyer');
    assert.equal(await DBService.updateDailyMissionProgress(uids.buyer, 'scansToday'), false); // progress 1/3, no throw
    const today = DBService.getTodayString();
    await rejects(getDoc(doc(db, 'userDailyMissions', `${uids.seller}_${today}`)), 'read other missions');
});

test('scan XP is granted once per scan and level follows xp', async () => {
    await login('owner');
    const r = await DBService.recordScan(uids.owner, { item: { objectName: 'Bottle' }, classification: 'safe', xpEarned: 15 });
    assert.equal(r.xpEarned, 15);
    const u = (await getDoc(doc(db, 'users', uids.owner))).data()!;
    assert.ok(u.xp >= 15 && u.totalScans >= 1);
});

test.after(async () => { await signOut(auth); process.exit(0); });
