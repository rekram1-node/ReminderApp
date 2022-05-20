/*
Notes:

4/9: got google oauth working had a problem with redirect uri...
... the issue is now local host refusing to connect, could be due to an Opera Firewall (the other browser)

4/10: not opera issue since chrome does the same thing

4/11: issue was that there was no server listening on port 3000 so we need to make sure to listen

4/12: program can now parse emails and send ones under a designated Subject, need to find a way..
.. to wait for all processes to finish and then send the subjects somewhere, or the parsed out information

4/23: the subject and date were under the res.data.payload.headers piece, it was hiding in Objects

service.users().threads().delete(userId, threadId).execute(); << maybe use this to delete emails!!!

5/20: encountered accident, deleted all project files had to copy via text and redownload google api module
    : additionally encountered error 400 on a request, it said malinformed auth, I used https://developers.onelogin.com/saml/online-tools/code-decode/url-encode-decode
    : I used that website to decode the URL code? not entirely sure what it does but I assume the code was being displayed in cmd in such a way it could not be interpreted 


*/


const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
let reminders_dates = []; // creating an object to use for the storage of message information


//const { OAuth2Client } = require('google-auth-library');
//var MailParser = require("mailparser").MailParser;

function emailParse (emailString)   {

  // Remind <sendto alias> <message to send> @ <schedule>
  // Remind <alias> is <phone number>

  var dict = {
      Person: "",
      Message: "",
      PhoneNumber: "",
      Time:  "",
      Schedule: ""
    };

  let parsed = emailString;
  parsed = parsed.replace('Remind ', '');

  let prt1 = parsed.substring(0, parsed.indexOf(' ')); // slicing name of person out
  dict.Person = prt1;

  parsed = parsed.substring(parsed.indexOf(' ') + 1); // redefining parsed to only contain remaining information
  

  if (parsed.substring(0, parsed.indexOf(' ')) == 'is')   {
      let nmber = parsed.substring(parsed.indexOf(' ') + 1);
      dict.PhoneNumber = nmber;
  }

  else    {
      let task = parsed.substring(0, parsed.indexOf(' @'));
      parsed = parsed.substring(parsed.indexOf(' @') + 1).replace('@', ''); // string should just be the time and anything following it

      dict.Message = task;

      if (parsed.length <= 4) {
          dict.Time = parsed;
      }
      
      else    {
          let t1me = parsed.substring(0, parsed.indexOf(' '));
          let sch3dule = parsed.substring(parsed.indexOf(' ') + 1); 

          dict.Time = t1me;
          
          if (sch3dule == "everyday") {
              dict.Schedule = sch3dule;
          }

          else    {
              sch3dule = parsed.substring(parsed.indexOf('on') + 3);
              dict.Schedule = sch3dule;
          }
      }
  }
  return dict;
}


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify']; // <- modified from:: const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listLabels);  // listLabels Function is called -----
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  // webclient 1 var client_secret = "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" //credentials.client_secret; 
  var client_secret = credentials.web.client_secret; //"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"
 
  var client_id = credentials.web.client_id; //"537483459079-gfhakgsbt4p98ebgu4s4tb8b1gaeg6jh.apps.googleusercontent.com"
  //var client_id = "remindertlc@gmail.com";

  // web client 1 var client_id = "537483459079-ui1phmugcc5udbom0n8bt4p9g2t9rihd.apps.googleusercontent.com" //credentials.client_id; 
  var redirect_uris = credentials.web.redirect_uris; // "http://localhost:3000/"//credentials.redirect_uris;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris); //redirect_uris[0]

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback); // getNewToken Function is called -----
    oAuth2Client.setCredentials(JSON.parse(token)); 
    callback(oAuth2Client);
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function listLabels(auth) {

  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {

      //console.log('Labels:');
      
      labels.forEach((label) => {
        // uncomment below to see labels
        //console.log(`- ${label.name} : ${label.id}`); //previously: console.log(`- ${label.name}`);

      });
    } else {
      console.log('No labels found.');
    }
  });
}

// original

function listMessages(auth, query){
  //query = 'reminderTLC@gmail.com';
  query = 'label:inbox label:unread subject:remind'
  //query = "label:inbox label:unread"
  //query = 'label:inbox label:unread'
  return new Promise((resolve, reject) => {    
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.messages.list(      
      {        
        userId: 'me',  
        q:query,      
        maxResults:10     
      },            (err, res) => {        
        if (err) {                    reject(err);          
          return;        
        }        
        if (!res.data.messages) {                    resolve([]);          
          return;        
        }                resolve(res.data);  
        //console.log(res.data.messages.length);          
        for (let i = 0; i<res.data.messages.length; i++)  { // maybe find a way to not have to look this?

          getMail(res.data.messages[i].id, auth); //.then(console.log(reminders_dates), console.log("Promise Failed")); // getMail function is called

          //.then(function(result) {
          //  console.log(reminders_dates);
          //})


        }
            
      }    
    );  
  })
}




fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listMessages); // Authorize function is called----- // listMessages function is called ----

});




function getMail(msgId, auth){
  //console.log(msgId)
  const gmail = google.gmail({version: 'v1', auth});
  //This api call will fetch the mailbody.
  gmail.users.messages.get({
      userId:'me',
      id: msgId ,
  }, (err, res) => {
      //console.log(res.data.labelIds)
      if(!err){
        //console.log("no error")

          /*

          // this is used to parse the body!!!

          var body = res.data.payload.parts[0].body.data; // part 0 is plain text, part 1 is html text which includes div tags
       
          const buff = Buffer.from(body, 'base64');
          var htmlBody =   buff.toString('utf-8'); // replacements for base.64 decode or atob
          */
        
          //console.log(htmlBody)
          //let TodaysMSGS = TodaysMSGS.push(htmlBody)

          //console.log(htmlBody);
          //for (i = 0; i < res.data.payload.headers.length; i++) {
           // console.log(res.data.payload.headers[i], i);  // used this to parse out content to find where subject and date were hidden
         // }

          let Raw_Reminder_Message = res.data.payload.headers[19]["value"]; // extracting the subject line

          //let Reminder_Message = res.data.payload.headers[19]["value"];
          let Reminder_Message = emailParse(Raw_Reminder_Message); // calling function to parse the subject into a dict and storing dict to reminder_message
          
          let Reminder_Date = res.data.payload.headers[17]["value"].replace(" -0500", ""); // removing digits off the date/time

          let msg = [Reminder_Message, Reminder_Date];

          reminders_dates.push(msg); // adding the dictionary and date to an array

          //console.log(Reminder_Message, Reminder_Date)
          console.log('\n ' + reminders_dates + ' \n')

          //return reminders_dates


          
        
      }
  });
}

