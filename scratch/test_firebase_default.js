import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

async function testFirebase() {
  try {
    console.log("Initializing Firebase with config:", firebaseConfig.projectId);
    const firebaseApp = initializeApp(firebaseConfig);
    
    console.log("Getting Firestore (DEFAULT)...");
    const db = getFirestore(firebaseApp);
    
    console.log("Attempting to fetch 'users' collection...");
    const querySnapshot = await getDocs(collection(db, 'users'));
    console.log("Success! Found", querySnapshot.size, "users.");
  } catch (err) {
    console.error("Firebase Test Failed:", err);
  }
}

testFirebase();
