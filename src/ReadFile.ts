import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';

dotenv.config();

const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME as string;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD as string;

const agent = new BskyAgent({
  service: 'https://bsky.social'
});

/**
 * Returns the profile data of the given user.
 * 
 * @param actor DID or handle of a user
 * @returns data { did, displayName, ... }
 */
async function fetchProfile(actor: string) {
  const { data } = await agent.getProfile({ actor: actor });

  return data;
}

/**
 * Returns the DID of a given user.
 * 
 * @param handle handle of a user
 * @returns did: string
 */
async function getDID(handle: string) {
  const did = (await fetchProfile(handle)).did;

  return did;
}

/**
 * Returns an array of every post that isn't a repost, in the form of an Object
 * 
 * @param did DID of a user
 * @returns posts: Object[]
 */
async function getPostsNoReposts(did: string) {
  const { data } = await agent.getAuthorFeed({
    actor: await getDID(did as string)
  });

  let posts: Object[] = [];

  data.feed.forEach(p => {
    if ( p.reason?.$type != 'app.bsky.feed.defs#reasonRepost' ) {
      posts.push(p);
    }
  });

  return posts;
}

async function getPostsJson(did = BLUESKY_USERNAME) {
  await this.login();

  const posts = await this.getPostsNoReposts(did);

  return JSON.stringify(posts);
}

async function login() {
  await this.agent.login({
    identifier: this.BLUESKY_USERNAME,
    password: this.BLUESKY_PASSWORD
  });
}