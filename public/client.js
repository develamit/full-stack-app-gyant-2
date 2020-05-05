
$(document).ready(function(){

  //=======================================================================
  // jQuery function when login button is clicked
  //   1. Verifies the admin userId
  //   2. Takes to the case, condition page
  //   3. Registers all the conditions in localStorage - ONE TIME
  //   4. Preserves the previous case to condition mapping, if any
  //=======================================================================
  $("#btn-login").click(function(){
    let userId = $("#login-username").val();
    let passwd = $("#login-password").val();
    console.log('button was clicked: userId: ', userId, 'passwd: ', passwd);
    localStorage.setItem('listId', "-1");

    $.post("/api/login",
    {
      userId: userId,
      passwd: passwd
    },
    function(data, status){
      console.log("Status: ", status);
      console.log("cases: ", data.cases);
      //console.log("caseDesc: ", data.cases.caseDesc);
      //console.log("conditions: ", data.conditions);
      let caseCode = data.cases.code; // Get the code associated with the case
      console.log('caseCode: ', caseCode);
      if (status) {
        $(".container").hide();
        $("#case-cond").show();
        $("#done-cond").hide();
        $("#case-quote").html(data.cases.caseDesc);
        $("#case-footer").html('Case Id: ' + data.cases.caseId + ' Sequence: ' + data.cases.seq);
        $("#logged-in-as").html('Logged in as: ' + userId + ' | <a href="#" id="log-out-id" class="log-out-class">Log Out</a>');
        //$("#logged-in-as").html('Logged in as: ' + userId + ' | <button id="log-out-id" type="button" class="btn btn-info"><i class="icon-hand-right"></i>Log Out</button>');

        // store the case sequence number in local storage
        localStorage.setItem('caseIdSeqNum', data.cases.seq);

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
    });
  });




  //=======================================================================
  // jQuery function when login button is clicked
  //=======================================================================
  $("#btn-next").click(function(){
    listId = localStorage.getItem('listId');
    curCaseSeqNum = localStorage.getItem('caseIdSeqNum');
    console.log('btn-next clicked: localstorage[listId] = ', listId, 'curCaseSeqNum = ', curCaseSeqNum);

    // Remove any previous active list items
    prevListIdxPos = localStorage.getItem('listIdIdx');
    console.log('prevListIdxPos: ', prevListIdxPos)
    if (prevListIdxPos) {
      let listItems = $(".list-group-item");
      listItems[prevListIdxPos].classList.remove("active");
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
      } else{
        console.log("cases: ", data.cases, " Mark DONE");
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
    console.log('list-group clicked: index = ', indexPos, 'id: ', listId);
    $(this).addClass("active");
  });


  //=======================================================================
  // jQuery function when logout is clicked
  // Using the .on() method to capture click events on dynamically created
  // elements by jQuery
  //=======================================================================

  $("div").on("click", "a#log-out-id", function(){
    console.log('log out clicked');
    $("#case-cond").hide();
    $("#signupbox").hide();
    $(".container").show();
    $("#login-username").val('');
    $("#login-password").val('');
  });

});
