import { AppBskyEmbedImages, BskyAgent } from '@atproto/api';
import { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { OutputSchema } from '@atproto/api/dist/client/types/app/bsky/feed/getAuthorFeed';

import * as dotenv from 'dotenv';

import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

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
async function getPostsNoReposts(handle: string) {
  const { data } = await agent.getAuthorFeed({
    actor: await getDID(handle)
  });

  let posts : FeedViewPost[] = []

  data.feed.forEach(p => {
    if ( p.reason?.$type != 'app.bsky.feed.defs#reasonRepost' && !( p.post.record.hasOwnProperty('reply') ) ) {
      posts.push(p);
    }
  });

  data.feed.length = 0;
  data.feed.push.apply(data.feed, posts);

  return posts;
}

async function getPostsJson(handle = BLUESKY_USERNAME) {
  const data = await getPostsNoReposts(handle);

  return JSON.stringify(data, null, 2);
}

async function login() {
  await agent.login({
    identifier: BLUESKY_USERNAME,
    password: BLUESKY_PASSWORD
  });
}

async function logFeed() {
  await login();

  const { data } = await agent.getAuthorFeed({
    actor: await getDID(BLUESKY_USERNAME)
  });

  console.log(data);
}

async function logJson() {
  await login();

  console.log(await getPostsJson());
}

async function logNoReposts() {
  await login();

  console.log(await getPostsNoReposts(BLUESKY_USERNAME));
}

async function App() {
  await login();

  let posts = '';

  await (await getPostsNoReposts(BLUESKY_USERNAME)).forEach(p => {
    let author = p.post.author;
    let record = p.post.record;

    posts += '<div class="post"><h3>' + ( author.displayName == '' ? author.handle : author.displayName ) + '</h3><p>' + record['text'] + '</p>' +
             '<span>replies: ' + p.post.replyCount?.toString() + '</span><br />' +
             '<span>reposts: ' + p.post.repostCount?.toString() + '</span><br />' +
             '<span>likes: ' + p.post.likeCount?.toString() + '</span></div>';
  });

  return (
    <div>
      <h1>Posts:</h1>
      {posts}
    </div>
  );
}

// logNoReposts();

// logJson();

const promise = Promise.resolve(App());

promise.then((value) => {
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(value);
});