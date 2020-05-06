
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

    //-----------------------------------
    // POST Request
    //-----------------------------------
    $.post("/api/signup",
    {
      userId: userId,
      passwd: passwd
    },
    function(data, status){
      console.log("Signup Status: ", status, typeof status);
      console.log("Signup data: ", data);

      if (data == 'created') {
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

    //-----------------------------------
    // POST Request
    //-----------------------------------
    $.post("/api/login",
    {
      userId: userId,
      passwd: passwd
    },
    function(data, status){
      console.log("Status: ", status);
      console.log("Message: ", data.message);
      console.log("cases: ", data.cases);

      //----------------------------------------------
      // sanity Check
      //----------------------------------------------
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
        let lastModified = data.cases.lastModified;
        let caseId = data.cases.caseId;

        // extracting the creation date from caseId
        let d = new Date(caseId);
        let dataCreatedOn = d.toLocaleString();
        console.log('Case created on: ', dataCreatedOn, 'lastModified: ', lastModified, typeof lastModified);
        console.log('caseCode: ', caseCode);

        if (status) {
          $(".container").hide();
          $("#case-cond").show();
          $("#btn-next").attr('disabled', false);
          $("#done-cond").hide();
          $("#case-quote").html(data.cases.caseDesc);

          if (lastModified == -1) {
            $("#case-footer").html('Case Id: ' + data.cases.caseId + ' Sequence: ' + data.cases.seq + '<br>' + 'Case created on: ' + dataCreatedOn);

          } else {
            let d1 = new Date(lastModified);
            let dataModifiedOn = d1.toLocaleString();
            console.log('Case modified on: ', dataModifiedOn);
            $("#case-footer").html('Case Id: ' + data.cases.caseId + ' Sequence: ' + data.cases.seq + '<br>' + 'Case modified on: ' + dataModifiedOn);
          }

          $("#logged-in-as").html('Logged in as: ' + userId + ' | <a href="#" id="log-out-id" class="log-out-class">Log Out</a>');

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
    let prevCaseModified = Number(localStorage.getItem(curCaseSeqNum));
    console.log('Current Case:', curCaseSeqNum, 'prevCaseModified: ', prevCaseModified, typeof prevCaseModified);
    if (isNaN(prevCaseModified)) {
      console.log('Current Case:', curCaseSeqNum, 'prevCaseModified is NaN');
      prevCaseModified = "";
    }

    //-----------------------------------
    // POST Request
    //-----------------------------------
    $.post("/api/nextcase",
    {
      curSeq: curCaseSeqNum,
      curCond: listId,
      modifiedOn: prevCaseModified
    },
    function(data, status){
      console.log("Next Status: ", status);
      if (data.cases) {
        console.log("cases: ", data.cases);

        // Show any pre-seleced condition for this case - entered from a previous attempt
        let nextCaseSeqNum = data.cases.seq;
        let caseCode       = data.cases.code; // Get the code associated with the case
        let lastModified   = data.cases.lastModified; // get the lastModified time for this case

        // obtain case creation time from caseId
        let caseId = data.cases.caseId;
        let d = new Date(caseId);
        let dataCreatedOn = d.toLocaleString();
        console.log('Case created on: ', dataCreatedOn);

        if (caseCode != "-1") { // condition has been selected for this case, in a previous attempt
          let codeIdx = localStorage.getItem(caseCode);
          if (codeIdx) {
            let listItems = $(".list-group-item");
            listItems[codeIdx].classList.add("active"); // make the list-item active from the previous selection
            localStorage.setItem('listId', caseCode);
            localStorage.setItem('listIdIdx', codeIdx);
          }
        }

        $("#case-quote").html(data.cases.caseDesc);

        if (lastModified == -1) {
          $("#case-footer").html('Case Id: ' + data.cases.caseId + ' Sequence: ' + data.cases.seq + '<br>' + 'Case created on: ' + dataCreatedOn);

        } else {
          let d1 = new Date(lastModified);
          let dataModifiedOn = d1.toLocaleString();
          console.log('Case modified on: ', dataModifiedOn);
          $("#case-footer").html('Case Id: ' + data.cases.caseId + ' Sequence: ' + data.cases.seq + '<br>' + 'Case modified on: ' + dataModifiedOn);
        }

        // store the case sequence number in local storage
        localStorage.setItem('caseIdSeqNum', data.cases.seq);
        localStorage.setItem(nextCaseSeqNum, null); // initializing case modified time to null
        console.log('Initializing modified time for nextCaseSeqNum: ', nextCaseSeqNum, ' with: ', localStorage.getItem(nextCaseSeqNum))

      } else{
        console.log("cases: ", data.cases, " Mark DONE");
        $("#case-quote").html('Done with Cases...');
        $("#case-footer").html('');
        $("#btn-next").attr('disabled', true);
        $("#done-cond").show();
        $("#card-done-id").html('<a href="#" id="log-out-id" class="log-out-class">You are Done. Click to log out</a>');
      }

    });

  });


  //=======================================================================
  // TODO: Can expand the functionality to include a prev Button
  //       This can be a good feature for future extension
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
    $("#signupbox").hide();
    $("#login-result-id").hide();
    $(".container").show();
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
