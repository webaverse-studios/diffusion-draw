import axios from "axios";

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

const handler = (req, res) => {
  // get the "s" param from the query string
  const { s } = req.query;
  console.log('received request');
    // cors proxy
    // redirect POST request to https://stable-diffusion.webaverse.com/mod
    // then return response to original requester
    axios.post("https://stable-diffusion.webaverse.com/mod?s=" + s, req.body)
        .then((response) => {
          console.log(response)
            res.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error)
            res.status(500).json(error);
        });
}
export default allowCors(handler)