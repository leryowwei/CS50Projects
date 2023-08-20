document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // on submit for form
  document.querySelector('#compose-form').onsubmit = send_email;
  
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#full-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#full-email').style.display = 'block';

  // empty mailbox
  document.querySelector('#emails-view').innerHTML = '';
  document.querySelector('#full-email').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load all sent mail/inbox/archive
  fetch(`/emails/${ mailbox }`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // loop through returned objects
      for (var key in emails) {
        if (emails.hasOwnProperty(key)) {
          const element = document.createElement('div');
          const email = emails[key];
          const email_key = email.id;    

          // read or unread will have different colours - so assign different class
          if (email.read) {
            element.className = 'summary-email-read';
          } else{
            element.className = 'summary-email-unread';
          };

          // give id
          element.setAttribute('id', `summary-${email_key}`);

          // inbox or sent are slightly different
          if (mailbox == 'sent'){
            element.innerHTML = `<span class="recipient">${email.recipients}</span><br>`
            + `<span class="subject">${email.subject}</span>`
            + `<span class="date">${email.timestamp}</span>`;
          } else{
            element.innerHTML = `<span class="recipient">${email.sender}</span><br>`
            + `<span class="subject">${email.subject}</span>`
            + `<span class="date">${email.timestamp}</span>`;
          };

          // add event listener
          element.addEventListener('click', () => view_mail(email, mailbox));

          // add to DOM
          document.querySelector('#emails-view').append(element);

          // add spacing line
          const spacing_element = document.createElement('div');
          spacing_element.innerHTML = '<hr>';
          document.querySelector('#emails-view').append(spacing_element);

        };
      };
  });
}

function view_mail(email, mailbox){

  // clear space
  document.querySelector('#full-email').innerHTML = '';

  // add actual email element
  const ele = document.createElement('div');
  ele.className = 'detail-email';

  // create parent for buttons
  const buttons_parent = document.createElement('div');
  buttons_parent.id = "buttons-parent";

  // add reply button
  const reply_element = document.createElement('button');
  reply_element.id = "reply";
  reply_element.innerHTML = "Reply";
  reply_element.addEventListener('click', () => reply_email(email));
  buttons_parent.appendChild(reply_element);

  // set up the rest of the content - archive/inbox different from sent
  if (mailbox == 'sent'){
    ele.innerHTML = `<span class="mail-date">${email.timestamp}</span><br>`
    + `<span class="mail-recipient">To: ${email.recipients}</span><br>`
    + `<span class="mail-subject">Subject: ${email.subject}</span><hr>`
    + `<span class="mail-body">${email.body}</span>`
    + `<br>`;
  
  } else{
    
    // include archive / unarchive buttons
    const archive_element = document.createElement('button');
    const unarchive_element = document.createElement('button');

    archive_element.id = 'archive';
    unarchive_element.id = 'unarchive';

    archive_element.innerHTML = "Archive";
    unarchive_element.innerHTML = "Unarchive";

    archive_element.setAttribute('data-id', email.id);
    unarchive_element.setAttribute('data-id', email.id);

    // add event listener
    archive_element.addEventListener('click', () => archive_email(true, email));
    unarchive_element.addEventListener('click', () => archive_email(false, email));

    buttons_parent.appendChild(archive_element);
    buttons_parent.appendChild(unarchive_element);

    // style button
    if (email.archived){
      archive_element.style.display = 'none';
      unarchive_element.style.display = 'block';
    } else{
      archive_element.style.display = 'block';
      unarchive_element.style.display = 'none';
    };

    // add email content
    ele.innerHTML += `<span class="mail-date">${email.timestamp}</span><br>`
    + `<span class="mail-recipient">From: ${email.sender}</span><br>`
    + `<span class="mail-subject">Subject: ${email.subject}</span><hr>`
    + `<span class="mail-body">${email.body}</span>`
    + `<br>`;
  };

  // add everything to DOM
  document.querySelector('#full-email').append(buttons_parent);
  document.querySelector('#full-email').append(ele);

  // mark as read 
  fetch(`/emails/${ email.id }`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true,
    })
  })
  .then(result => {
      // Print result
      console.log(result);

      // change class name
      document.querySelector(`#summary-${ email.id }`).className = 'summary-email-read';
  });
  return false;
}

function send_email(){

  // read data out first
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // send out data
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body,
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      // load sent mailbox
      load_mailbox('sent');
  })
  // Catch any errors and log them to the console
  .catch(error => {
      console.log('Error:', error);
  });

  return false;
}

function archive_email(flag, email){

  // archive or unarchive email
  fetch(`/emails/${ email.id }`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: flag,
    })
  })
  .then(result => {
      // Print result
      console.log(result);
      // load sent mailbox
      load_mailbox('inbox');
  });
  return false;
}

function reply_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#full-email').style.display = 'none';

  // craft composition fields
  document.querySelector('#compose-recipients').value = email.sender;

  var subject = email.subject;
  if (subject.substring(0, 4) === 'RE: '){
    document.querySelector('#compose-subject').value = subject;
  } else{
    document.querySelector('#compose-subject').value = `RE: ${ subject }`;
  };

  document.querySelector('#compose-body').value = `On ${ email.timestamp } ${ email.sender } wrote: ${ email.body }`;
}
