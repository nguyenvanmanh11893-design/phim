import test from 'node:test';
import assert from 'node:assert/strict';
import MySQLSeatRepository from '../src/Infrastructure/Http/Repositories/MySQLSeatRepository.js';
import Seat from '../src/Domain/Cinema/Entity/Seat.js';

const storedSeat = {
  id: 11, room_id: 2, row: 'A', number: 3, type: 'VIP',
  is_active: 1, created_at: new Date('2026-01-01T00:00:00Z'),
};

// Guard the generated SQL's identifier quoting, without a live database.
function poolReturning(result) {
  const calls = [];
  return {
    calls,
    async execute(sql, params) {
      calls.push({ sql, params });
      assert.match(sql, /`row`/);
      assert.doesNotMatch(sql.replaceAll('`row`', ''), /\brow\b/i);
      assert.equal((sql.match(/\?/g) || []).length, params.length);
      return [result];
    },
  };
}

for (const [method, args, list] of [
  ['findByRoomId', [2], true],
  ['findByIdAndRoomId', [11, 2], false],
  ['findById', [11], false],
]) {
  test(`${method}: quote ROW while preserving seat data and bound IDs`, async () => {
    const pool = poolReturning([storedSeat]);
    const result = await new MySQLSeatRepository(pool)[method](...args);
    assert.deepEqual(pool.calls[0].params, args);
    const seat = list ? result[0] : result;
    assert.equal(seat.toJSON().row, 'A');
    assert.equal(seat.toJSON().label, 'A3');
    assert.equal(seat.toJSON().type, 'VIP');
    if (list) assert.match(pool.calls[0].sql, /ORDER BY `row` ASC, number ASC/);
  });
}

test('saveMany: quote ROW and preserve multiple rows of bound seat values', async () => {
  const pool = poolReturning({ insertId: 11 });
  const seats = [
    Seat.fromPersistence(storedSeat),
    Seat.fromPersistence({ ...storedSeat, id: 12, row: 'B', number: 1 }),
  ];
  const saved = await new MySQLSeatRepository(pool).saveMany(seats);
  assert.deepEqual(pool.calls[0].params, [
    2, 'A', 3, 'VIP', 1, storedSeat.created_at,
    2, 'B', 1, 'VIP', 1, storedSeat.created_at,
  ]);
  assert.deepEqual(saved.map(seat => seat.label), ['A3', 'B1']);
});
