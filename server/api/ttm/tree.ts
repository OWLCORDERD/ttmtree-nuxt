import { readFile } from 'fs/promises';

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const { type } = getQuery(event);
    try {
      const filePath = 'assets/js/' + type + '.json';
      const fileContent = await readFile(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      return data;
    } catch (error) {
      throw createError({
        statusCode: 500,
        message: '파일을 읽는 중 오류가 발생했습니다.'
      })
    }
  }
})
