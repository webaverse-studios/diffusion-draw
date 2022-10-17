import axios from "axios";
import fs from  'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern; but there might not be origin (for instance call from browser)
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

const handler = async (req, res) => {
  // get the "s" param from the query string
  const { s } = req.query;
  console.log('received request');

  const buf = await buffer(req);
  const rawBody = buf.toString('utf8');

  // cors proxy
    // redirect POST request to https://stable-diffusion.webaverse.com/mod
    // then return response to original requester
    axios.post("https://stable-diffusion.webaverse.com/mod", rawBody, {
      params: { s },
      headers: { "Access-Control-Allow-Origin": "*" },
      responseType: "arraybuffer",
    })
        .then((response) => {
          console.log('sending response')
            res.send(response.data)
        })
        .catch((error) => {
          console.log(error)
            res.status(500).json(error);
        });
}
export default allowCors(handler)