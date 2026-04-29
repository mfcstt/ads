import { getAdsDailyPerformance } from './server/shopeeService';

async function test() {
  try {
    const res = await getAdsDailyPerformance('01-04-2026', '15-04-2026');
    console.log(JSON.stringify(res.dailyData, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
