import test from 'node:test';
import assert from 'node:assert/strict';
import Movie from '../src/Infrastructure/Http/Repositories/MySQLMovieRepository.js';
import Cinema from '../src/Infrastructure/Http/Repositories/MySQLCinemaRepository.js';
import Combo from '../src/Infrastructure/Http/Repositories/MySQLComboRepository.js';
import Showtime from '../src/Infrastructure/Http/Repositories/MySQLShowtimeRepository.js';
import User from '../src/Infrastructure/Http/Repositories/MySQLUserRepository.js';
import Rating from '../src/Infrastructure/Http/Repositories/MySQLRatingRepository.js';
import Booking from '../src/Infrastructure/Http/Repositories/MySQLBookingRepository.js';

// Simulate the strict LIMIT contract without a production database connection.
// mysql2 encodes JS numbers as DOUBLE, rejected here by affected MySQL versions.
function strictPaginationPool() {
  const calls = [];
  return {
    calls,
    async execute(sql, params) {
      calls.push({ sql, params });
      assert.equal((sql.match(/\?/g) || []).length, params.length);
      if (/LIMIT \?/.test(sql)) {
        const count = /OFFSET \?/.test(sql) ? 2 : 1;
        for (const value of params.slice(-count)) {
          assert.equal(typeof value, 'string', 'Avoid DOUBLE pagination binds');
          assert.match(value, /^\d+$/);
        }
        return [[]];
      }
      return [[{ total: '23' }]];
    },
  };
}

const cases = [
  ['movies', Movie, (r,p) => r.findAll({ ...p, genre: 'Action' }), ['"Action"']],
  ['cinemas', Cinema, (r,p) => r.findAll({ ...p, city: 'Hanoi' }), ['Hanoi']],
  ['combos', Combo, (r,p) => r.findAll(p), []],
  ['showtimes', Showtime, (r,p) => r.findAll({ ...p, movieId: 7, cinemaId: 2 }), [7,2]],
  ['users', User, (r,p) => r.findAll({ ...p, role: 'admin' }), ['admin']],
  ['ratings', Rating, (r,p) => r.findByMovieId(7,p), [7]],
  ['user bookings', Booking, (r,p) => r.findByUserId(7,{ ...p, status:'PENDING' }), [7,'PENDING']],
  ['admin bookings', Booking, (r,p) => r.findAll({ ...p, userId:7, status:'CONFIRMED' }), ['CONFIRMED',7]],
];

for (const [name, Repository, call, filters] of cases) {
  for (const page of [1,3]) {
    test(`${name} page ${page}: preserves filters and numeric pagination metadata`, async () => {
      const pool = strictPaginationPool();
      const result = await call(new Repository(pool), {page,limit:10});
      assert.deepEqual(pool.calls[0].params, [...filters,'10',String((page-1)*10)]);
      assert.deepEqual(pool.calls[1].params, filters);
      assert.equal(result.total,23);
      assert.equal(result.totalPages,3);
      assert.equal(result.page,page);
      assert.equal(result.limit,10);
      assert.deepEqual(result.data,[]);
    });
  }
}

test('hot movies uses a compatible bound limit', async () => {
  const pool = strictPaginationPool();
  assert.deepEqual(await new Movie(pool).getHotMovies(), []);
  assert.deepEqual(pool.calls[0].params,['5']);
});
