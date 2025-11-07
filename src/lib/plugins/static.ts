import { staticPlugin as _staticPlugin } from '@elysiajs/static'

export const staticPlugin = async () =>
  await _staticPlugin({
    prefix: '/',
    alwaysStatic: true,
  })
