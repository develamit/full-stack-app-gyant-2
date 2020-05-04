
$(document).ready(function(){
  $("#btn-login").click(function(){
    let userId = $("#login-username").val();
    let passwd = $("#login-password").val();
    console.log('button was clicked: userId: ', userId, 'passwd: ', passwd);

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

        $.each( data.conditions, function( index, value ){
          console.log(value.code, " : ", value.desc);
          $('.list-group').append('<li>' + value.code + ' || ' + value.desc + '</li>');
          //<a href="#" class="list-group-item list-group-item-action">Cras justo odio</a>
        });

      }
    });
  });
});
