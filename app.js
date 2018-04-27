//Modification des choix du menu:
// - Demande d'une date
// - Repeter les choix du menu
// Ajout d'une condition si l'utilisateur est dans userData, afficher Aurevoir au lieu de bievenue
require('dotenv').config();

var restify = require('restify');
const SpaceXAPI = require('SpaceX-API-Wrapper');
let SpaceX = new SpaceXAPI();
var builder = require('botbuilder');

//Server
var server = restify.createServer();
server.listen(process.env.PORT, function(){
    console.log("%s listening to %s", server.name,server.url)
})

//Connector
var connector = new builder.ChatConnector({
    appId : process.env.MICROSOFT_APP_ID,
    appPassword : process.env.MICROSOFT_APP_PWD,
});

server.post('/api/messages',connector.listen());
var inMemoryStorage = new builder.MemoryBotStorage();


//Universal bot
var bot = new builder.UniversalBot(connector, [
    function(session){
        session.beginDialog('menu')},
    
    function(session){
    if(!session.userData.profile){session.send("Bonjour");}

    session.beginDialog('greetings',session.userData.profile)},
        
    function(session,results){
        if(!session.userData.profile){
            session.userData.profile = results.response;
            session.send(`Bienvenue ${session.userData.profile.name}`);
        }
        else{
            session.send(`Au revoir ${session.userData.profile.name}`); 
        }
    },
    ]).set('storage',inMemoryStorage);

  
bot.dialog('greetings',[
    //STEP 1
    function(session,results,skip){
            session.dialogData.profile = results || {};
            if(!session.dialogData.profile.name){
                builder.Prompts.text(session,'Quel est votre prénom?')
            } else{
                skip();
            }
        },

    //STEP 2
    function(session,results){
        if(results.response){
            session.dialogData.profile.name = results.response
        }
        session.endDialogWithResult({response : session.dialogData.profile});
    }
    ]
);

var menuItems = {
    "Obtenir les infos de Space X en JSON" : {
        item : 'getSpaceXInfoJson'
    },
    "Obtenir la date" : {
        item : 'getDate'
    },
    "Repeter les choix" : {
        item : 'repeat'
    },
}

bot.dialog('menu',[
    function(session){
        builder.Prompts.choice(session,'Choisir une option',menuItems, {listStyle: 3})
    },

    function(session,results){
        var choice = results.response.entity
        var item = menuItems[choice].item
        session.beginDialog(item)
    }
]);

bot.dialog('getSpaceXInfoJson',[
    function(session){
        SpaceX.getCompanyInfo(function(err, info){
            response = JSON.stringify(info);
            session.endDialog(response);
        });
    }
]);

bot.dialog('getDate',[
    function(session){
        var currentDate = new Date()
        var day = (currentDate.getDate() < 10 ? "0" + currentDate.getDate() : currentDate.getDate());
        var month = (currentDate.getMonth() + 1 < 10 ? "0" + currentDate.getMonth() : currentDate.getMonth());
        var year = currentDate.getFullYear()
        
        session.endDialog("Nous sommes le " + day + "/" + month + "/" + year);
    }
]);

bot.dialog('repeat',[
    function(session){
        session.beginDialog('menu')
    }
]);