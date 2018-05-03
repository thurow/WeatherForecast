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

function getLocationLatLong(city) {
    var geocoder =  new google.maps.Geocoder();
    geocoder.geocode(
        {'address': encodeURIComponent(city) +', br'}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var location = results[0].geometry.location
            var latitude = location.lat();
            var longitude = location.lng();
            getWeatherResult(latitude,longitude);
          } else {
            $('#previsao').removeClass("button-disabled");
            $('legend').hide();
          }
    });
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
                    "Máxima do dia: " + Math.round(result.tempMaxDay) + " ºC" + "<br />" + result.recomenda + "</div>");
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

String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

function getWeatherCustomResult(value) {
    tempMin.push(value.temp.min);
    tempMax.push(value.temp.max);
    var result = {
        date : getDayOfWeather(value.dt),
        dayOfWeek: getDayOfWeek(value.dt),
        description: getDescriptionOfWeatherDay(value.weather[0]).capitalize(),
        tempMinDay: value.temp.min,
        tempMaxDay: value.temp.max,
        recomenda: getRecomendacao(value)
    }
    return result;
}

function getDescriptionOfWeatherDay(value) {
    return value.description;
}

function getRecomendacao(value) {
    var tempDay = value.temp.day;
    var estimateRain = value.rain ? value.rain : 0;
    var dayOfWeek = getDayOfWeek(value.dt);
    if (dayOfWeek == "Sábado" || dayOfWeek == "Domingo") {
        if (tempDay > 25 && estimateRain < 70) {
            return 'Um bom dia para ir para Praia, aproveite!'
        } else {
            return 'Um bom dia para ficar em casa assistindo filmes!'
        }
    }
    return '';
}

function setFavoriteLocation() {
    var favoriteInfos = {
        city: $("#cidades").val(),
        state: $("#estados").val()
    }
    store.set("favoriteLocation",JSON.stringify(favoriteInfos));
}

function getDayOfWeek(value) {
    jsDate = new Date(value * 1000);
    var days = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
    return days[jsDate.getDay()];
}

function getDayOfWeather(value)
{
    jsDate = new Date(value * 1000);
    return jsDate.getDate() + '/' + (jsDate.getMonth()+1) + '/' + jsDate.getFullYear();
}
