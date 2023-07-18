const express = require('express');
const axios = require('axios');
require('dotenv').config();
const {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware
} = require('discord-interactions/dist');

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL;
const CLIENT_PUBLIC_KEY = process.env.CLIENT_PUBLIC_KEY;

app.post('/interactions', verifyKeyMiddleware(CLIENT_PUBLIC_KEY), async (req, res) => {
  const message = req.body;

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    try{
        const wallet = message.data.options[0].value;

        const body = {
          wallet:wallet,
          page:1,
          channel_id: message.channel_id
        };

        const config = {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        switch (message.data.name.toLowerCase()) {
          case 'retrieve':
              body.page=message.data.options[1].value;
              axios.post(`https://${req.headers.host}/retrieveInfo`, body, config);

              res.status(200).send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                  content: 'We are working for you :)'
                }
              });
            
            break;
          case 'info':
            axios.post(`https://${req.headers.host}/info`, body, config);

            res.status(200).send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'We are working for you :)'
              }
            });
            break;
          default:
            await sendErrorMessage(message.channel_id);
            break;
        }
     }
    catch (error) {
      await sendErrorMessage(message.channel_id);
    }
  } else {
    await sendErrorMessage(message.channel_id);
  }
});

app.post('/retrieveInfo',express.json(), async (req, res) => {
  const { wallet, page, channel_id } = req.body;
  try {
    const data = {
      id: 67,
      jsonrpc: '2.0',
      method: 'qn_fetchNFTs',
      params: 
        {
          wallet:wallet,
          page: parseInt(page),
          perPage: 10
        }
    };

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(QUICKNODE_RPC_URL, data, config);

    let embedResponses = [];
    if (response.data.result?.assets) {
      embedResponses=response.data.result.assets.map((datax) => {
      const collection = datax;
      const name = collection.name ? (collection.name.length > 256 ? collection.name.slice(0, 253) : collection.name) : "No name";
      // Retrieve the image URL if available

      const imageUrl = collection.imageUrl ? (collection.imageUrl.startsWith("https://") ? collection.imageUrl : "https://ipfs.io/ipfs/bafkreigbzfovprwjdzhvbfmh3n5j4nidaqi455bvomy4kpg2jjvi6b4geq") : "https://ipfs.io/ipfs/bafkreigbzfovprwjdzhvbfmh3n5j4nidaqi455bvomy4kpg2jjvi6b4geq";

      return {
        title: name,
        description: `Address: ${collection.tokenAddress}`,
        image: { url: imageUrl } // Include the image URL in the response
      };
    }
    ) 
  }

    if (response.data.result.totalPages === 0) {
      embedResponses = [
        {
          title: "Sorry, we couldn't find any data",
          description: 'No information available'
        }
      ];
    }

    const messageData = {
      content: 'Built by irwing@dfhcommunity.com',
      embeds: embedResponses
    };

    await sendMessage(channel_id, messageData);

    res.status(200).send({
      data: {
        content: 'OK'
      }
    });
  } catch (error) {
    await sendErrorMessage(channel_id);
  }
});

app.post('/info',express.json(), async (req, res) => {
  const { wallet,page, channel_id } = req.body;
  try {
    const data = {
      id: 67,
      jsonrpc: '2.0',
      method: 'qn_fetchNFTs',
      params: 
        {
          wallet:wallet,
          page: parseInt(page),
          perPage: 10
        }
    };

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(QUICKNODE_RPC_URL, data, config);

    let embedResponses = [];

    if (response.data.result.totalPages === 0) {
      embedResponses = [
        {
          title: "Sorry, we couldn't find any data",
          description: 'No information available'
        }
      ];
    }
    else{
      embedResponses = [
        {
          title:`You currently possess a total of `+ response.data.result.totalItems *  response.data.result.totalPages + ` NFT in your collection.` ,
          description: `Sections: ` +response.data.result.totalPages,
        }
      ];
    }

    const messageData = {
      content: 'Built by irwing@dfhcommunity.com',
      embeds: embedResponses
    };

    await sendMessage(channel_id, messageData);

    res.status(200).send({
      data: {
        content: 'OK'
      }
    });
  } catch (error) {
    await sendErrorMessage(channel_id);
  }
});

async function sendErrorMessage(channelId) {
  const messageData = {
    content: 'Built by irwing@dfhcommunity.com',
    embeds: [
      {
        title: 'Houston we have a problem :(',
        description: 'No information available'
      }
    ]
  };
  await sendMessage(channelId, messageData);
}

async function sendMessage(channelId, data) {
  try {
    const config = {
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    await axios.post(`https://discord.com/api/v8/channels/${channelId}/messages`, data, config);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

const port = 3000; // Choose a port number

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
