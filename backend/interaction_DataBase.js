const Server = require('./server');
async function ping() {
    await Server.db.command({ping: 1}, function(err, result){
        if(!err){
            console.log("Ping to DB successfull");
            console.log(result);
        }
        else {
            console.log('err = ', err);
        }
    });
}

async function closeConnectionWithMongoDB() {
    await Server.mongoClient.close();
    console.log("Connection with DB closed");
}

async function addDocumentToCollection(documentJSON, collectionName) {
    var collection = await Server.db.collection(collectionName);
    const insertedDocument = await collection.insertOne(documentJSON);
    console.log("1 document inserted");
    console.log("insertedDocument: ", insertedDocument);
    const insertedId =  insertedDocument.insertedId.toString();
    console.log("insertedId: ", insertedId);
    return insertedId;
}

async function getListJSON_AllPendingGames() {
    var collectionName = "Pending_Games";
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { gameStarted: false };
    const allPendingGames = await pendingGamesCollection.find(filter).toArray();
    console.log(allPendingGames.length);
    const amountPendingGames = allPendingGames.length
    var resultJSON = { amount: amountPendingGames, generalJSON: allPendingGames };
    return resultJSON;
}

async function updateDocumentByIdAttach(documentID, documentJSON, collectionName) {

    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { _id: Server.ObjectId(documentID) };
    const updateDoc = {
        $set: {
          addr2: documentJSON.addr2,
          addr2_kindTokenOfDeposit: documentJSON.addr2_kindTokenOfDeposit,
          addr2_amountOfDeposit: documentJSON.addr2_amountOfDeposit,
          addr2_timeOfLockingDeposit: documentJSON.addr2_timeOfLockingDeposit
        },
      };
    const result = await pendingGamesCollection.updateOne(filter, updateDoc);
    console.log('result = ', result);
    if (result.modifiedCount == 1) {
        return "ok";
    } else {
        return "fall";
    }
} 

async function getAddrOfRival (documentID, collectionName, ownAddress) {
    const filter = { _id: Server.ObjectId(documentID) };
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const documentJSON = await pendingGamesCollection.findOne(filter);
    console.log('documentJSON = ', documentJSON);
    if (documentJSON.addr1 == ownAddress) {
        return documentJSON.addr2;
    } else if (documentJSON.addr2 == ownAddress) {
        return documentJSON.addr1;
    } else {
        var err = new Error("func 'getAddrOfRival': Wrong address");
        throw err;
    }
}

async function getDocumentById(documentID, collectionName) {
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { _id: Server.ObjectId(documentID) };
    const documentJSON = await pendingGamesCollection.findOne(filter);
    return documentJSON;
} 

async function updateGameStarted(documentID, collectionName) {
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { _id: Server.ObjectId(documentID) };
    const updateDoc = {
        $set: {
          gameStarted: true,
        },
      };
    const result = await pendingGamesCollection.updateOne(filter, updateDoc);
    console.log('result = ', result);
} 

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

async function thinkNumber(documentID, collectionName) {
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { _id: Server.ObjectId(documentID) };
    const thinkedNumber_ = getRandomInt(10);
    const updateDoc = {
        $set: {
            thinkedNumber: thinkedNumber_,
        },
      };
    const result = await pendingGamesCollection.updateOne(filter, updateDoc);
    console.log('result = ', result);
    console.log('thinkedNumber_ = ', thinkedNumber_);
} 

async function performedDigit(documentID, collectionName, numberAddress, digit) {
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { _id: Server.ObjectId(documentID) };
    var updateDoc;
    if (numberAddress == 1)
    {
        updateDoc = {
            $set: {
                addr1_performed: digit,
            },
        };
    } else if (numberAddress == 2) {
        updateDoc = {
            $set: {
                addr2_performed: digit,
            },
        };
    }
    const result = await pendingGamesCollection.updateOne(filter, updateDoc);
    console.log('result = ', result);
    if (numberAddress == 1)
    {
        console.log('addr1 performed = ', digit);
    }
    else if (numberAddress == 2) {
        console.log('addr2 performed = ', digit);
    } else {
        console.log('Wrong "numberAddress" = ', numberAddress);
    }
} 

async function updateGameFinished(documentID, collectionName, addrWin) {
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { _id: Server.ObjectId(documentID) };
    const updateDoc = {
        $set: {
          gameFinished: true,
          addrWinner: addrWin,
        },
      };
    const result = await pendingGamesCollection.updateOne(filter, updateDoc);
    console.log('result = ', result);
} 

async function isGameFinished(documentID, collectionName) {
    const pendingGamesCollection = await Server.db.collection(collectionName);
    const filter = { _id: Server.ObjectId(documentID) };
    const documentJSON = await pendingGamesCollection.findOne(filter);
    console.log('documentJSON.gameFinished = ', documentJSON.gameFinished);
    if (documentJSON.gameFinished == true) {
        return true;
    } else {
        return false;
    }
} 