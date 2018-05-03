var tempMin = new Array();
var tempMax = new Array();

window.store = {
    localStorageSupport : function() {
        try {
            if (/Edge\/\d./i.test(navigator.userAgent) || isMsie()) {
                return false;
            }
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    },
    set : function(name,value,days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
        }
        else {
            var expires = "";
        }
        if( this.localStorageSupport() ) {
            localStorage.setItem(name, value);
        }
        else {
            document.cookie = name+"="+value+expires+"; path=/";
        }
    },
    get : function(name) {
        if( this.localStorageSupport() ) {
            return localStorage.getItem(name);
        }
        else {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        }
    },
    del : function(name) {
        if( this.localStorageSupport() ) {
            localStorage.removeItem(name);
        }
        else {
            this.set(name,"",-1);
        }
    }
}

function isMsie() {
    if (navigator.appName == 'Microsoft Internet Explorer' ||  !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1))
    {
      return true;
    }
    return false;
}

function cleanDivs()
{
    $(".result-box .result").html("");
    $(".result-min-max").html("");
    $(".result-today > .result > #message").html("");
    $(".result-today > .result > #temperature").html("");
    $(".result-today > .result > #recomendation").html("");
    $(".result-today > .result > figure").html("");
    $(".chart").html("<canvas id='chart-temperatures'></canvas>");
}

function getCityId(city) {
    var url = "http://apiadvisor.climatempo.com.br/api/v1/locale/city?name=" + city + "&token=2a086ed2a84226dbc364606b1924558d";
    $.getJSON(url, function(result){
        if ($.isEmptyObject(result)) {
            cleanDivs();
            $('#previsao').removeClass("button-disabled");
            $('legend').hide();
            alert('Não foi possível localizar a preisão desta cidade.');
            return false;
        }
        console.log(result);
        if (!result.error) {
            getWeatherResultAdv(result[0].id)
        } else {
            cleanDivs();
            $('#previsao').removeClass("button-disabled");
            $('legend').hide();
            console.log(result.detail);
        }
    });
    // var geocoder =  new google.maps.Geocoder();
    // geocoder.geocode(
    //     {'address': city +', br'}, function(results, status) {
    //       if (status == google.maps.GeocoderStatus.OK) {
    //         var location = results[0].geometry.location
    //         var latitude = location.lat();
    //         var longitude = location.lng();
    //         getWeatherResult(latitude,longitude);
    //       } else {
    //         $('#previsao').removeClass("button-disabled");
    //         $('legend').hide();
    //       }
    // });
}

function getWeatherResultAdv(cityId) {
    var url = "http://apiadvisor.climatempo.com.br/api/v1/forecast/locale/"+cityId+"/days/15?token=2a086ed2a84226dbc364606b1924558d";
    $.getJSON(url, function(response){
        if (!response.error) {
            console.log(response);
            tempMin = new Array();
            tempMax = new Array();
            $(".result-box .result").html("");
            $(".result-min-max").html("");
            $.each(response.data, function(index, value){
                console.log(value.rain.probability);
                if (index == 0) {
                    getTodayWeather(value);
                    return true;
                }
                var result = getWeatherCustomResult(value);
                $(".result-box .result").append("<div class='weather-day'><h3>"+ result.date+ " - " + result.dayOfWeek + "</h3>" + 
                    result.description + "<br />" + "Mínima do dia: " + Math.round(result.tempMinDay) + " ºC<br />" + 
                    "Máxima do dia: " + Math.round(result.tempMaxDay) + " ºC </div>");
            });
            $(".result-min-max").append("<div class='temp temp-min'>Temperatura Mínima da semana: "+ Math.round(getMinTemperature(tempMin)) + 
                " ºC</div>");
            $(".result-min-max").append("<div class='temp temp-max'>Temperatura Máxima da semana: "+ Math.round(getMaxTemperature(tempMax)) + 
                " ºC</div>");
            getChart(response.data);
            $('#previsao').removeClass("button-disabled");
            $('legend').hide();
        } else {
            cleanDivs();
            console.log(response.detail);
            $('#previsao').removeClass("button-disabled");
            $('legend').hide();
            alert('Ocorreu algum erro na consulta.')
        }
    });
}

function getTodayWeather(value) {
    $(".result-today > .result > #message").text(value.text_icon.text.phrase.reduced);
    $(".result-today > .result > #temperature").text("Hoje temos a máxima de "+ value.temperature.max + "°C e a mínima de " 
        + value.temperature.min + "°C;.");
    $(".result-today > .result > #recomendation").text(getRecomendacao(value));
    $(".result-today > .result figure").html("<img src='images/"+value.text_icon.icon.afternoon+".png' />")
    console.log(value.text_icon.text.phrase);
}

function getWeatherResult(latitude,longitude)  {
    var settings = {
          "async": true,
          "crossDomain": true,
          "url": 'http://api.openweathermap.org/data/2.5/forecast/daily?lat='+latitude+'&lon='+longitude+'&appid=d7e6060865ccce37a26227bef299cbe0&units=metric&lang=pt',
          "method": "GET",
          "dataType": "jsonp",
          "headers": {
            "authorization": "Basic YWRtaW46cGFzc3dvcmQ=",
            "cache-control": "no-cache",
            "postman-token": "54733c33-4918-811b-3987-69d6edeaa3a0"
          }
        }
    $.ajax(settings).done(function (response) {
        if (response.cod == '200') {
            tempMin = new Array();
            tempMax = new Array();
            $(".result").html("");
            $(".result-min-max").html("");
            $.each(response.list, function(index, value){
                var result = getWeatherCustomResult(value);
                $(".result").append("<div class='weather-day'><h3>"+ result.date+ " - " + result.dayOfWeek + "</h3>" + 
                    result.description + "<br />" + "Mínima do dia: " + Math.round(result.tempMinDay) + " ºC<br />" + 
                    "Máxima do dia: " + Math.round(result.tempMaxDay) + " ºC </div>");
            });
            $(".result-min-max").append("<div class='temp temp-min'>Temperatura Mínima da semana: "+ Math.round(getMinTemperature(tempMin)) + 
                " ºC</div>");
            $(".result-min-max").append("<div class='temp temp-max'>Temperatura Máxima da semana: "+ Math.round(getMaxTemperature(tempMax)) + 
                " ºC</div>");
            getChart(response.list);
            $('#previsao').removeClass("button-disabled");
            $('legend').hide();
        } else {
            $('#previsao').removeClass("button-disabled");
            $('legend').hide();
            alert('Ocorreu algum erro na consulta.')
        }
    });
}

function getChart(list) {
    var data = {
        labels: [],
        datasets: [
            {
                label: "Temperatura Máxima",
                backgroundColor: 'transparent',
                borderColor: 'rgb(255,215,0)',
                data: []
            },
            {
                label: "Temperatura Mínima",
                backgroundColor: 'transparent',
                borderColor: "rgb(135,206,235)",
                data: []
            }
        ]
    };

    var options = {
        responsive: true
    }

    $.each(list, function(index, value){
        var result = getWeatherCustomResult(value);
        data.labels.push(result.dayOfWeek);
        data.datasets[0].data.push(Math.round(result.tempMaxDay));
        data.datasets[1].data.push(Math.round(result.tempMinDay));
    });

    var ctx = $("#chart-temperatures").get(0).getContext("2d");
    var temperaturesChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

function getMinTemperature(temp) {
    return Math.min.apply(null, temp);
}

function getMaxTemperature(temp) {
    return Math.max.apply(null, temp);
}

function getWeatherCustomResult(value) {
    tempMin.push(value.temperature.min);
    tempMax.push(value.temperature.max);
    var result = {
        date : value.date_br,
        dayOfWeek: getDayOfWeek(value.date),
        description: value.text_icon.text.pt,
        tempMinDay: value.temperature.min,
        tempMaxDay: value.temperature.max
    }
    return result;
}

function getDescriptionOfWeatherDay(value) {
    return value.description;
}

/** continue customizing */
function getRecomendacao(value) {
    var tempDay = value.temperature.afternoon;
    var estimateRain = value.rain.probability ? value.rain.probability : 0;
    var dayOfWeek = getDayOfWeek(value.date);
    if (tempDay > 25 && estimateRain < 70) {
        if (dayOfWeek == "Sábado" || dayOfWeek == "Domingo") {
            return 'Um bom dia para ir para Praia, aproveite!'
        }
        return "Hoje não vai chover e vai ser quente, vista algo confortável."
    } else {
        if (dayOfWeek == "Sábado" || dayOfWeek == "Domingo") {
            return 'Um bom dia para ficar em casa assistindo filmes!'
        }
        return "É provável que hoje chova, leve uma sombrinha para o trabalho!"
    }
}

function setFavoriteLocation() {
    var favoriteInfos = {
        city: $("#cidades").val(),
        state: $("#estados").val()
    }
    store.set("favoriteLocation",JSON.stringify(favoriteInfos));
}

function getDayOfWeek(value) {
    jsDate = new Date(value);
    var days = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
    return days[jsDate.getDay()];
}

function getDayOfWeather(value)
{
    jsDate = new Date(value * 1000);
    return jsDate.getDate() + '/' + (jsDate.getMonth()+1) + '/' + jsDate.getFullYear();
}

$(function(){
    $("#favorite").prop('checked', false);
    var favoriteLocation = store.get('favoriteLocation');
    if (favoriteLocation) {
        var locationFavorite = JSON.parse(favoriteLocation);
        new dgCidadesEstados({
          cidade: document.getElementById('cidades'),
          estado: document.getElementById('estados'),
          estadoVal: locationFavorite.state,
          cidadeVal: locationFavorite.city
        });
    } else {
        new dgCidadesEstados({
          cidade: document.getElementById('cidades'),
          estado: document.getElementById('estados'),
          estadoVal: 'SC',
          cidadeVal: 'Blumenau'
        });
    }
    $("#previsao").click();
});

$("#previsao").on("click", function() {
    $(this).addClass("button-disabled");
    $('legend').show();
    var city = $("#cidades").val();
    if (city) {
        if ($("#favorite").is(":checked")) {
            setFavoriteLocation();
        }
        getCityId(city);
    } else {
        alert('Você deve informar uma cidade para gerar a previsão!');
        $(this).removeClass("button-disabled");
        $('legend').hide();
    }
});