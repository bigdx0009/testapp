const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp();

var config = {
	apiKey: "AIzaSyBGF64c7RECuOwJgfG62UpRZMJYtv3mmIg",
  	authDomain: "test-project-81890.firebaseapp.com",
  	databaseURL: "https://test-project-81890.firebaseio.com",
  	projectId: "pest-project-81890",
  	storageBucket: "test-project-81890.appspot.com",
  	messagingSenderId: "233571820565",
  	appId: "1:233571820565:web:b572dc6b9a3a64c9"
};

const firebase = require('firebase');
firebase.initializeApp(config);

const db = admin.firestore();

app.get('/screams',(req, res) => {
	db
		.collection('screams')
		.orderBy('createdAt', 'desc')
		.get().then(data => {
		let screams = [];
		data.forEach(doc => {
			screams.push({
				screamID: doc.id,
				body: doc.data().body,
				userHandle: doc.data().userHandle,
				createdAt: doc.data().createdAt,
				commentCount: doc.data().commentCount,
				likeCount: doc.data().likeCount
			})
		});
		return res.json(screams);
	})
	.catch(err => console.error(err));
});

app.post('/scream',(req, res) => {
	const newScream = {
		body: req.body.body,
		userHandle: req.body.userHandle,
		createdAt: new Date().toISOString()
	};

	db
		.collection('screams')
		.add(newScream)
		.then(doc => {
			res.json({message: `document ${doc.id} created successfully`});
		})

	.catch(err => {
		res.status(500).json({error: 'somthing went wrong'});
		console.error(err);
	});
});

app.post('/signup', (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	};
let token, userId;

db.doc(`/users/${newUser.handle}`).get()
	.then(doc => {
		if(doc.exsist){
			return res.status(400).json({ handle: 'this handle is already taken'});
		}else {
			return firebase
				.auth()
				.createUserWithEmailAndPassword(newUser.email, newUser.password)
		}
})
	.then(data => {
		userId = data.user.uid;
		return data.user.getIdToken();
})
	.then(token => {
		token = token
		const userCredentials = {
			handle: newUser.handle,
			email: newUser.email,
			createdAt: new Date().toISOString(),
			userId
		};
		return db.doc(`/users/${newUser.handle}`).set(userCredentials);
})
.then((data) => {
	return res.status(201).json
})
	.catch(err => {
		console.error(err);
		return res.status(500).json({ error: err.code});
	});
})

exports.api = functions.region('us-east1').https.onRequest(app);