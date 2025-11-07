import { cors as _cors } from '@elysiajs/cors'
import pkg from '@package'

const regex = new RegExp(`^https://([a-z0-9-]+.)?${pkg.name.toLowerCase()}.io$`)
const isProduction = import.meta.env.NODE_ENV === 'production'
const allowedOrigins = isProduction ? regex : true

export const cors = () =>
  _cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
