
$(document).ready(function(){
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
      console.log("caseDesc: ", data.cases.caseDesc);
      console.log("conditions: ", data.conditions);
      if (status) {
        $(".container").hide();
        $("#case-cond").show();
        $("#case-quote").html(data.cases.caseDesc);
        $("#logged-in-as").html('Logged in as: ' + userId + ' | <a href="#" id="log-out-id" class="log-out-class">Log Out</a>');
        //$("#logged-in-as").html('Logged in as: ' + userId + ' | <button id="log-out-id" type="button" class="btn btn-info"><i class="icon-hand-right"></i>Log Out</button>');

        $.each( data.conditions, function( index, value ){
          console.log(value.code, " : ", value.desc);
          //$('.list-group').append('<li>' + value.code + ' || ' + value.desc + '</li>');
          $('.list-group').append('<a href="#" id="' + value.code + '" class="list-group-item list-group-item-action">' + value.code + ' || ' + value.desc + '</a>');
          //<a href="#" class="list-group-item list-group-item-action">Cras justo odio</a>
        });

      }
    });
  });

  $("#btn-next").click(function(){
    listId = localStorage.getItem('listId');
    console.log('btn-next clicked: localstorage[listId] = ', listId);

  });

  $("#btn-prev").click(function(){
    listId = localStorage.getItem('listId');
    console.log('btn-prev clicked');

  });

  // To get the index postion of the list item that has been clicked
  // The list item has been generated dymnamically by jQuery
  $(".list-group").on("click", "a", function(){
    prevListIdxPos = localStorage.getItem('listIdIdx');
    console.log('prevListIdxPos: ', prevListIdxPos)
    if (prevListIdxPos) {
      let listItems = $(".list-group-item");
      listItems[prevListIdxPos].classList.remove("active");
    }

    // Select all list items - and then remove active
    //let listItems = $(".list-group-item");
    //console.log('listItems: ', listItems);
    // Remove 'active' tag for all list items
    //for (let i = 0; i < listItems.length; i++) {
        //listItems[i].classList.remove("active");
    //}

    let indexPos = $(this).index();
    let listId   = $(this).attr('id');
    localStorage.setItem('listId', listId);
    localStorage.setItem('listIdIdx', indexPos);
    console.log('list-group clicked: index = ', indexPos, 'id: ', listId);
    //$('.list-group.active').removeClass("active");
    $(this).addClass("active");
  });


  // To capture click events on dynamically created elements by jQuery
  $("div").on("click", "a#log-out-id", function(){
    console.log('log out clicked');
    $("#case-cond").hide();
    $("#signupbox").hide();
    $(".container").show();
    //$("#login-username").val('');
    //$("#login-password").val('');
  });

});
