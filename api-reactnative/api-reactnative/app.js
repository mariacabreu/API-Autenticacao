const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:8082', // ou '*' se for apenas teste local
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Middleware para responder preflight requests
app.options('*', cors());
