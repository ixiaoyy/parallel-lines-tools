export const MAX_STATISTICS_CHARACTERS = 200_000;
export const MAX_STATISTICS_VALUES = 10_000;

export type StatisticsError =
  | 'inputTooLarge'
  | 'tooManyNumbers'
  | 'invalidNumber'
  | 'outOfRange';

export type StatisticsResult =
  | { status: 'empty' }
  | { status: 'invalid'; error: StatisticsError; line?: number }
  | {
      status: 'ready';
      count: number;
      sum: number;
      mean: number;
      median: number;
      min: number;
      max: number;
    };

const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * 按一行一个十进制数统计，空行忽略；任何无效值都返回原行号，不提取文本或跳过坏数据。
 * 采用普通浮点运算；拒绝非有限值、下溢为零及无法安全表示的整数，限制输入与排序规模。
 */
export function computeStatistics(input: string): StatisticsResult {
  if (input.length > MAX_STATISTICS_CHARACTERS)
    return { status: 'invalid', error: 'inputTooLarge' };
  const numbers: number[] = [];
  const lines = input.split(/\r\n|\n|\r/);
  for (let index = 0; index < lines.length; index++) {
    const token = lines[index].trim();
    if (!token) continue;
    if (!decimal.test(token))
      return { status: 'invalid', error: 'invalidNumber', line: index + 1 };
    const value = Number(token);
    const significantDigits = token
      .split(/[eE]/)[0]
      .replace(/[+.-]/g, '')
      .replace(/^0+|0+$/g, '').length;
    if (
      !Number.isFinite(value) ||
      (Number.isInteger(value) && !Number.isSafeInteger(value)) ||
      (significantDigits > 15 && !/^[+-]?\d+$/.test(token)) ||
      (value === 0 && /[1-9]/.test(token.split(/[eE]/)[0]))
    )
      return { status: 'invalid', error: 'outOfRange', line: index + 1 };
    numbers.push(value);
    if (numbers.length > MAX_STATISTICS_VALUES)
      return { status: 'invalid', error: 'tooManyNumbers' };
  }
  if (!numbers.length) return { status: 'empty' };

  // 补偿求和减少正负数抵消产生的浮点误差，不把它宣称为十进制财务精度。
  let sum = 0;
  let correction = 0;
  let min = numbers[0];
  let max = numbers[0];
  for (const value of numbers) {
    const next = sum + value;
    correction +=
      Math.abs(sum) >= Math.abs(value)
        ? sum - next + value
        : value - next + sum;
    sum = next;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const total = sum + correction;
  const ordered = [...numbers].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  const median =
    ordered.length % 2
      ? ordered[middle]
      : ordered[middle - 1] / 2 + ordered[middle] / 2;
  return {
    status: 'ready',
    count: numbers.length,
    sum: total,
    mean: total / numbers.length,
    median,
    min,
    max
  };
}

/** 安全整数完整显示；其他浮点值最多显示 15 位有效数字，消除常见二进制尾差。 */
export function formatStatistic(value: number): string {
  return Number.isSafeInteger(value)
    ? value.toString()
    : Number(value.toPrecision(15)).toString();
}
