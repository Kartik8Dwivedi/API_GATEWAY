const express = require('express');
const  { PORT } = require('./config/serverConfig');
const morgan = require('morgan');
const { createProxyMiddleware} = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const startServer = () => {
    const app = express();

    const limiter = rateLimit({
        windowMs: 15*60*1000, // * 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    })

    app.use(morgan('combined'));
    app.use(limiter);
    app.use('/bookingservice', async (req,res,next) => {
        try {
          const response = await axios.get(
            "http://localhost:3001/api/v1/isauthenticated",
            {
              headers: {
                "x-access-token": req.headers["x-access-token"],
              },
            }
          );
          if (response.data.success) {
            next();
          } else {
            return res.status(401).json({ message: "Unauthorized" });
          }
        } catch (error) {
            return res.status(401).json({ 
                message: "Something went wrong",
                error: error.message
            });
        }
    });
    app.use(
      "/bookingservice",
      createProxyMiddleware({
        target: "http://localhost:3002",
        changeOrigin: true,
      })
    );
    app.get('/home', (req, res) => {
        res.json({message: 'OK'})
    });

    app.listen(PORT, () => {
        console.log(`Server started at port ${PORT}`);
    })
}

startServer();