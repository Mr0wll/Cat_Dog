const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}));

const header = `
<div class="logo">
<a href="index.html">
    <img src="logo.png" alt="Adopt A-Cat/Dog" />
</a>
</div>
<h1>Adopt A-Cat/Dog</h1>
<p>${new Date().toLocaleString('en-US', {hour12: true})}</p>
`;

const footer = `
<p>© 2024 Adopt A-Cat/Dog. All rights reserved.</p>
<a href="#">Privacy/Disclaimer Statement</a>
`

// Read user data from user.txt file
let userData = fs.readFileSync('./user.txt', 'utf8').split('\n').map(line => {
    const [username, password] = line.trim().split(':');
    return { username, password };
});

app.get('/', (req, res) => {
    res.send('running');
});

app.get('/header', (req, res) => {
    res.send({ header });
});

app.get('/footer', (req, res) => {
    res.send({ footer });
});

// Route to handle user registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (userData.some(user => user.username === username)) {
        res.status(400).send({ message : 'Username already exists. Please choose a different username.'});
    } else {
        userData.push({ username, password });
        fs.writeFileSync('user.txt', userData.map(user => `${user.username}:${user.password}`).join('\n'));

        res.send({message : 'Registration successful'});
    }
});

// Route to handle user authentication
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = userData.find(user => user.username === username && user.password === password);

    if (user) {
        req.session.loggedIn = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Route for logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send('Logged out successfully');
        }
    });
});

app.post('/addPetInformation', (req, res) => {
    const {animalType, breed, age, gender, compatibility, comments, owner_name, owner_email} = req.body;

    // Read the content of the pet information file
    fs.readFile('./petInformation.txt', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Split the file content into an array of lines
        const lines = data.trim().split('\n');

        let lastId = 0;
        if (lines.length > 0) {
            // Extract the last line and get the last ID
            const lastLine = lines[lines.length - 1];
            const lastEntry = lastLine.split(':');
            lastId = parseInt(lastEntry[0]); // Extract and parse the ID
        }

        // Increment the last ID to generate the new ID
        const newId = lastId + 1;

        // Construct the data string to append to the file
        const newData = `${newId}:${animalType}:${breed}:${age}:${gender}:${compatibility}:${comments}:${owner_name}:${owner_email}\n`;

        // Append the new data to the file
        fs.appendFile('petInformation.txt', newData, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Internal Server Error');
            } else {
                res.status(200).send('Pet information added successfully');
            }
        });
    });
});

app.post('/search', (req, res) => {
    const { animalType, breed, age, gender } = req.body;

    // Read the content of the pet information file
    fs.readFile('petInformation.txt', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Split the file content into an array of lines
        const lines = data.trim().split('\n');

        // Filter pet information based on search criteria
        const searchResults = lines.map(line => {
            const [id, animalType_, breed_, age_, gender_, ...rest] = line.split(':');
            if (
                (!animalType || animalType === animalType_) &&
                (!breed || breed.toLowerCase() === breed_.toLowerCase()) &&
                (!age || age === age_) &&
                (!gender || gender === gender_)
            ) {
                return {
                    id: id,
                    animalType: animalType_,
                    breed: breed_,
                    age: age_,
                    gender: gender_
                };
            }
        }).filter(Boolean);
        console.log(searchResults);
        // Send search results to the client
        res.json(searchResults);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
