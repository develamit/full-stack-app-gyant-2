
$(document).ready(function(){


  //=======================================================================
  // jQuery function when login button is clicked
  //   0. Calls the api /api/signup
  //   1. Cretes the user, if not found
  //   2. Displays appropriate messages back to the user
  //=======================================================================
  $("#btn-signup").click(function(){
    let userId = $("#signup-username").val();
    let passwd = $("#signup-password").val();
    console.log('signup button was clicked: userId: ', userId, 'passwd: ', passwd);
    $.post("/api/signup",
    {
      userId: userId,
      passwd: passwd
    },
    function(data, status){
      console.log("Signup Status: ", status, typeof status);
      console.log("Signup data: ", data);

      if (data == 'created') {
        //$("#signup-result-id").html('Registration successful. Please Sign In');
        $("#signup-result-id").html('<a href="#" id="sign-in-id" class="log-out-class">Registration successful. Please Sign In</a>');
      } else if (data == 'exists') {
        $("#signup-result-id").html('User exists. Please try a different userId');
      }

    });

  });



  //=======================================================================
  // jQuery function when login button is clicked
  //   0. Calls the api /api/login
  //   1. Verifies the userId
  //   2. Takes to the case, condition page
  //   3. Registers all the conditions in localStorage - ONE TIME
  //   4. Preserves the previous case to condition mapping, if any
  //=======================================================================
  $("#btn-login").click(function(){
    let userId = $("#login-username").val();
    let passwd = $("#login-password").val();
    console.log('login button was clicked: userId: ', userId, 'passwd: ', passwd);

    localStorage.setItem('listId', "-1"); // initialization

    $.post("/api/login",
    {
      userId: userId,
      passwd: passwd
    },
    function(data, status){
      console.log("Status: ", status);
      console.log("Message: ", data.message);
      console.log("cases: ", data.cases);

      // sanity Check
      if (data.message == "invalid") {
        $("#login-result-id").show();
        $("#login-result-id").html('User not found. Please Sign up');

      } else if (data.message == "passwd-incorrect") {
        $("#login-result-id").show();
        $("#login-result-id").html('Incorrect password. Please try again');

      } else if (data.message == "valid") {

        //console.log("caseDesc: ", data.cases.caseDesc);
        //console.log("conditions: ", data.conditions);
        let caseCode = data.cases.code; // Get the code associated with the case
        let caseId = Math.trunc(data.cases.caseId * 1000);
        let lastModified = Math.trunc(data.cases.lastModified * 1000);
        let lastModDate = ""
        //if (caseId != lastModified) {
          let d = new Date(lastModified);
          lastModDate = d.toLocaleString();
          console.log('Case last modified on: ', lastModDate);
        //}
        console.log('type: ', caseId, lastModified)
        console.log('caseCode: ', caseCode);
        if (status) {
          $(".container").hide();
          $("#case-cond").show();
          $("#btn-next").attr('disabled', false);
          $("#done-cond").hide();
          $("#case-quote").html(data.cases.caseDesc);
          $("#case-footer").html('Case Id: ' + data.cases.caseId + ' Sequence: ' + data.cases.seq);
          $("#logged-in-as").html('Logged in as: ' + userId + ' | <a href="#" id="log-out-id" class="log-out-class">Log Out</a>');
          //$("#logged-in-as").html('Logged in as: ' + userId + ' | <button id="log-out-id" type="button" class="btn btn-info"><i class="icon-hand-right"></i>Log Out</button>');

          // store the case sequence number in local storage
          localStorage.setItem('caseIdSeqNum', data.cases.seq);
          localStorage.setItem(data.cases.seq, null); // initializing case modified time to null

          // One Time Process during login: List all the conditions in a list-group-item
          let listItems = $(".list-group-item");
          console.log('Num listItems: ', listItems.length);
          if (listItems.length < 1) {
            $.each( data.conditions, function( index, value ){
              //console.log(value.code, " : ", value.desc);
              localStorage.setItem(value.code, index); // One Time - store a map of condition code : index Position
              if (caseCode != "-1" && value.code == caseCode) { // This case has a meaningful condition code - from a previous selection
                localStorage.setItem('listId', caseCode);
                localStorage.setItem('listIdIdx', index);
                $('.list-group').append('<a href="#" id="' + value.code + '" class="list-group-item list-group-item-action active">' + value.code + ' || ' + value.desc + '</a>');
              } else {
                $('.list-group').append('<a href="#" id="' + value.code + '" class="list-group-item list-group-item-action">' + value.code + ' || ' + value.desc + '</a>');
              }
            });
          } else {

              // Remove any previous active list items
              prevListIdxPos = localStorage.getItem('listIdIdx');
              console.log('prevListIdxPos: ', prevListIdxPos);
              if (prevListIdxPos) {
                let listItems = $(".list-group-item");
                listItems[prevListIdxPos].classList.remove("active");
              }

              if (caseCode != "-1") {
                let codeIdx = localStorage.getItem(caseCode);
                if (codeIdx) {
                  let listItems = $(".list-group-item");
                  listItems[codeIdx].classList.add("active");
                  localStorage.setItem('listId', caseCode);
                  localStorage.setItem('listIdIdx', codeIdx);
                }
              }
          }

        }


    } // end of else

    });
  });




  //=======================================================================
  // jQuery function when next button is clicked
  // 1. Deselects the current selection from the list-item
  // 2. Calls the api /api/nextcase
  // 3. Receives the next case as a response
  // 4. Maps the pre-selected code for this case to the corresponding list-item
  //=======================================================================
  $("#btn-next").click(function(){
    listId = localStorage.getItem('listId');
    curCaseSeqNum = localStorage.getItem('caseIdSeqNum');
    console.log('btn-next clicked: localstorage[listId] = ', listId, 'curCaseSeqNum = ', curCaseSeqNum, 'caseModified on: ', localStorage.getItem(curCaseSeqNum));

    // Remove any previous active list items
    prevListIdxPos = localStorage.getItem('listIdIdx');
    console.log('prevListIdxPos: ', prevListIdxPos)
    if (prevListIdxPos) {
      let listItems = $(".list-group-item");
      listItems[prevListIdxPos].classList.remove("active");
    }

    // extract the last modified time for the current case
    let lastModified = Number(localStorage.getItem(curCaseSeqNum));
    console.log('lastModified2: ', lastModified, typeof lastModified);
    if (isNaN(lastModified)) {
      console.log('lastModified2 is NaN');
    } else {
      let d = new Date(lastModified);
      lastModDate = d.toLocaleString();
      console.log('Current Case last modified on: ', lastModDate);
    }

    $.post("/api/nextcase",
    {
      curSeq: curCaseSeqNum,
      curCond: listId
    },
    function(data, status){
      console.log("Next Status: ", status);
      if (data.cases) {
        console.log("cases: ", data.cases);

        // Show any pre-seleced code in the conditions - from a previous entry attempt
        let caseCode = data.cases.code; // Get the code associated with the case
        if (caseCode != "-1") {
          let codeIdx = localStorage.getItem(caseCode);
          if (codeIdx) {
            let listItems = $(".list-group-item");
            listItems[codeIdx].classList.add("active");
            localStorage.setItem('listId', caseCode);
            localStorage.setItem('listIdIdx', codeIdx);
          }
        }

        $("#case-quote").html(data.cases.caseDesc);
        $("#case-footer").html('Case Id: ' + data.cases.caseId + ' Sequence: ' + data.cases.seq);
        // store the case sequence number in local storage
        localStorage.setItem('caseIdSeqNum', data.cases.seq);
        localStorage.setItem(curCaseSeqNum, null); // initializing case modified time to null
      } else{
        console.log("cases: ", data.cases, " Mark DONE");
        $("#btn-next").attr('disabled', true);
        $("#done-cond").show();
        $("#card-done-id").html('<a href="#" id="log-out-id" class="log-out-class">You are Done. Click to log out</a>');
      }

    });

  });


  //=======================================================================
  // TODO: Can expand the functionality to include a prev Button
  //=======================================================================
  //$("#btn-prev").click(function(){
    //listId = localStorage.getItem('listId');
    //console.log('btn-prev clicked');

  //});




  //=======================================================================
  // jQuery function when list-group-item is clicked
  // Note: The list-group-item has been generated dymnamically by jQuery before.
  //       Hence using .on("click", ...) method to handle this case.
  //       Regular click() events would not work here
  // 1. Get the index postion of the list item that has been clicked
  // 2. Deselect the previous list-item
  // 3. Select the current list-item (active)
  //=======================================================================
  $(".list-group").on("click", "a", function(){
    prevListIdxPos = localStorage.getItem('listIdIdx');
    console.log('prevListIdxPos: ', prevListIdxPos)
    if (prevListIdxPos) {
      let listItems = $(".list-group-item");
      listItems[prevListIdxPos].classList.remove("active");
    }

    let indexPos = $(this).index();
    let listId   = $(this).attr('id');
    localStorage.setItem('listId', listId);
    localStorage.setItem('listIdIdx', indexPos);
    let curCaseSeqNum = localStorage.getItem('caseIdSeqNum');
    let caseModifiedOn = Date.now();
    localStorage.setItem(curCaseSeqNum, caseModifiedOn); // storing when the case was modified

    console.log('list-group clicked: index = ', indexPos, 'id: ', listId, 'case seq:', curCaseSeqNum, 'modified on: ', caseModifiedOn);
    $(this).addClass("active");
  });


  //=======================================================================
  // jQuery function when "You are Done" is clicked. This simply takes the
  // user back to the login page
  // Using the .on() method to capture click events on dynamically created
  // elements by jQuery
  //=======================================================================

  $("div").on("click", "a#log-out-id", function(){
    console.log('log out clicked');
    $("#case-cond").hide();
    $("#done-cond").hide();
    $("#signupbox").hide();
    //$(".container").show();
    $("#signupbox").hide();
    $("#login-result-id").hide();
    $(".container").show();
    //$('#loginbox').show();
    $("#login-username").val('');
    $("#login-password").val('');
  });


  //=======================================================================
  // jQuery function when sign-in is clicked from registraion page footer
  // This simply takes the user back to the login page
  // Using the .on() method to capture click events on dynamically created
  // elements by jQuery
  //=======================================================================

  $("div").on("click", "a#sign-in-id", function(){
    console.log('sign-in clicked');
    $("#singnup-username").val('');
    $("#signup-password").val('');
    $("#login-username").val('');
    $("#login-password").val('');
    $("#signupbox").hide();
    $("#login-result-id").hide();
    $('#loginbox').show();
  });

});
