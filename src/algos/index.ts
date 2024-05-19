import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as test from './whats-alf'
import dotenv from 'dotenv'
dotenv.config()

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [process.env.RECORD_NAME.shortname]: process.env.RECORD_NAME.handler,
}

export default algos
