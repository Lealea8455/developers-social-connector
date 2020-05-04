const express = require('express');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const app = express();

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => { res.send('API running'); });

// Define routes
const userRoute = require('./routes/api/users');
const authRoute = require('./routes/api/auth');
const profileRoute = require('./routes/api/profile');
const postsRoute = require('./routes/api/posts');

app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/profile', profileRoute);
app.use('/api/posts', postsRoute);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
