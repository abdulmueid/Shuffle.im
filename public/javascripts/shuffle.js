//shuffle.js
var animateTitle = {
	animateTitle_interval: null,
	animateTitle_title: document.title,
    animateTitle_idx: 0,
    clear : function() {
        clearInterval(this.animateTitle_interval);
        this.animateTitle_idx      = 0;
        this.animateTitle_interval = null;
        document.title  = this.animateTitle_title;
    },
    create : function() {
        document.title = "/Shuffle/";
        this.animateTitle_interval = setInterval(function(){
        	animateTitle.swap(["/Shuffle/","-Shuffle-","\\Shuffle\\"]);
        }, 1000);
    },
    swap : function(text) {
        this.animateTitle_idx++;
        document.title = text[this.animateTitle_idx % text.length];
    },
    isAnimating: function() {
        if( animateTitle.animateTitle_interval != null ) {return true;}
        else {return false;}
    }
};

function setStyles(){
    //define vars
    $('#message').width($(window).width() - parseInt($('#message').css('border-left-width'))*2 - $('#connect').outerWidth(true) - $('#send').outerWidth(true));
    $('#chatarea').height($(window).height() - $('#header').outerHeight(true) - $('#controls').outerHeight(true));
    $('#message textarea').width($('#message').width() - 6);
    $('#message textarea').height($('#message').height() - parseInt($('#message').css('border-top-width'))*2 - 6);

}

$(document).ready(function(){
var connected = 0;
var typing = 0;
var focused = 1;

    $(window).focus(function(){
		if (animateTitle.isAnimating()) {
			animateTitle.clear();
		}
        focused = 1;
	});
	$(window).blur(function(){focused=0;});

    $(window).resize(function() {
        setStyles();
    });
    setTimeout('setStyles()',1);

    var disable_controls = function() {
        $('textarea').val('');
        $('textarea').attr('disabled','disabled');
        $('#btn_right').attr('disabled', 'disabled');
        //$('#btn_left').focus();
    };
    var enable_controls = function() {
        $('textarea').removeAttr('disabled');
        $('#btn_right').removeAttr('disabled');
        //$('textarea').focus();
    };

    disable_controls();
    $('#btn_left').click(function(){
		if (connected == 0) {
			$('#chatarea').html("");
            $('#state').html('Connecting');
			socket.emit('startchat', 'true');
			connected = 2;
		}
        if(connected == 3) {
            socket.emit('leavechat', 'true');
			$('#chatarea').append("<div><strong>You have left the conversation</strong></div>");
			$('#chatarea').append("<div><strong>Click on the connect button to start chatting</strong></div>");
            $('#chatarea').scrollTop($("#chatarea").prop('scrollHeight'));
            $('#state').html('Connect');
            disable_controls();
			connected = 0;
        }
		if(connected == 1) {
            $('#state').html('Really?');
			connected = 3;
		}
    });
    $('#btn_right').click(function(){
        if (connected == 3) {
            connected = 1;
            $('#state').html('Connected');
        }
		if (connected == 1) {
			if ($('textarea').val() != "") {
				if (typing == 1) {
					socket.emit("stoptyping", "true");
					typing = 0;
				}
				msg = $('textarea').val();
				msg = msg.replace(/</g, "&lt;");
				msg = msg.replace(/>/g, "&gt;");
                if($('#typing').length) {
                    $('#typing').before( $('<div><span class="you">You:</span> ' + msg + '</div>') );
                } else {
                    $('#chatarea').append('<div><span class="you">You:</span> ' + msg + '</div>');
                }
				$('#chatarea').scrollTop($("#chatarea").prop('scrollHeight'));
				socket.send(msg);
				$('textarea').val("");
			}
		}
    });

    var socket = io.connect();
	socket.on('connect', function() {
		socket.emit("iamconnected");
	});
	socket.on('usercount', function(count) {
		$('#counter').html(count);
	});
    socket.on('partner-joined', function() {
		connected = 1;
		enable_controls();
        $('#chatarea').html("");
        $('#state').html('Connected');
	});
	socket.on('partner-left', function() {
		connected = 0;
		disable_controls();
        $('#state').html('Connect');
	});
	socket.on('message', function(msg) {
        if(msg.type == 'normal') {
            $('#chatarea').append('<div><span class="stranger">Stranger:</span> ' + msg.msg + '</div>');
        }
        if(msg.type == 'announce') {
            $('#chatarea').append('<div><strong>' + msg.msg + '</strong></div>');
        }
		$('#chatarea').scrollTop($("#chatarea").prop('scrollHeight'));
        if(focused == 0 && !animateTitle.isAnimating()) {animateTitle.create();}
	});
	socket.on('typing', function() {
		$('#chatarea').append('<div id="typing">Stranger is typing...</div>');
		$('#chatarea').scrollTop($("#chatarea").prop('scrollHeight'));
	});
	socket.on('stoptyping', function() {
		$('#typing').remove();
	});

    $(document).keydown(function(e) {
		if (e.keyCode == '27' || e.keyCode == '13' ) {
			e.preventDefault();
		}
	});
    $(document).keyup(function(e) {
    if (e.keyCode == 27) { $("#btn_left").trigger("click"); }
    });

    $('textarea').keydown(function(e) {
		if (e.keyCode == '13') {
			e.preventDefault();
		}
	});
	$('textarea').keyup(function(e) {
		if (e.which == 13) {
			$("#btn_right").trigger("click");
			return true;
		}
		if (connected == 1) {
			if ($('textarea').val() != "") {
				if (typing == 0) {
					socket.emit("typing", "true");
					typing = 1;
				}
			} else {
				if (typing == 1) {
					socket.emit("stoptyping", "true");
					typing = 0;
				}
			}
		}
	});
});
