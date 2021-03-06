var app = angular.module('projek', [
  'ngCordova',
  'ionic',
  'beauby.jsonApiDataStore',
  'dbaq.ionCoverHeader',
  'projek.data',
  'projek.push',
  'projek.controllers',
  'projek.users',
  'projek.home',
  'projek.projects',
  'projek.quote',
  'projek.announcement',
  'projek.news',
  'projek.directives',
  'projek.constants'
])

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider) {

  $stateProvider

  .state('intro', {
    url: '/',
    templateUrl: 'templates/intro.html',
    data: {
      redirectIfAuth: true
    }
  })

  .state('term-condition', {
    url: '/term-condition',
    templateUrl: 'templates/tab-term-condition.html'
  })

  .state('contactus', {
    url: '/contactus',
    templateUrl: 'templates/tab-contactus.html'
  })

  .state('login', {
    url: '/login?method',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl',
    data: {
      redirectIfAuth: true
    }
  })

  .state('register', {
    url: '/register',
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl',
    data: {
      redirectIfAuth: true
    }
  })

  .state('verify', {
    url: '/verify/:id?method&value&altMethod&altValue',
    templateUrl: 'templates/verify.html',
    controller: 'VerifyCtrl',
    data: {
      redirectIfAuth: true
    }
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    data: {
      auth: true
    }
  })

  // Each tab has its own nav history stack:
  .state('tab.home', {
    url: '/home',
    views: {
      'tab-home': {
        templateUrl: 'templates/tab-home.html',
        controller: 'HomeCtrl'
      }
    }
  })

  .state('tab.updates', {
    url: '/updates',
    views: {
      'tab-updates': {
        templateUrl: 'templates/tab-announcement.html',
        controller: 'AnnouncementCtrl'
      }
    }
  })

  .state('tab.quotes', {
    url: '/quotes',
    views: {
      'tab-quotes': {
        templateUrl: 'templates/tab-quote.html',
        controller: 'QuoteCtrl'
      }
    }
  })

  .state('tab.news', {
    url: '/news',
    views: {
      'tab-news': {
        templateUrl: 'templates/tab-news.html',
        controller: 'NewsCtrl'
      }
    }
  })

  .state('news-detail/:newsid', {
    url: '/news/:newsid',
    templateUrl: 'templates/tab-news-detail.html',
    controller: 'NewsDetailCtrl',
    data: {
      auth: true
    }
  })

  .state('tab.projects', {
    url: '/projects',
    views: {
      'tab-projects': {
        templateUrl: 'templates/tab-projects.html',
        controller: 'ProjectsCtrl'
      }
    }
  })

  .state('project', {
    url: '/projects/:id',
    templateUrl: 'templates/tab-project.html',
    controller: 'ProjectCtrl',
    data: {
      auth: true
    }
  })

  .state('project-item', {
    url: '/project-item/:id',
    templateUrl: 'templates/tab-project-item.html',
    controller: 'ProjectItemCtrl',
    data: {
      auth: true
    }
  })

  .state('project-update', {
    url: '/project-updates/:id',
    templateUrl: 'templates/project-update.html',
    controller: 'ProjectUpdateCtrl',
    data: {
      auth: true
    }
  })

  .state('account', {
    url: '/account',
    templateUrl: 'templates/account.html',
    controller: 'AccountCtrl',
    reloadOnSearch: false,
    resolve: {
      user: function ($auth) {
        return $auth.currentUser();
      }
    },
    data: {
      auth: true
    }
  })

  .state('agent-form', {
    url: '/agent/form?id',
    templateUrl: 'templates/agent.form.html',
    controller: 'AgentFormCtrl',
    data: {
      auth: true
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');
  $ionicConfigProvider.navBar.alignTitle('center');
  $httpProvider.defaults.paramSerializer = '$httpParamSerializerJQLike';
  $httpProvider.interceptors.push(function($rootScope, $q, $injector) {
    var current = 0;
    var showLoading = function (url) {
      return !!url.match(/https?/)
    }

    return {
      request: function(config) {
        if (showLoading(config.url) && current === 0) {
          $rootScope.$broadcast('loading:show');
        }

        current++;
        return config;
      },

      response: function(response) {
        current--;

        if (current === 0) {
          $rootScope.$broadcast('loading:hide');
        }

        return response;
      },

      responseError: function(response) {
        $rootScope.$broadcast('loading:hide');

        if (response.status === 401) {
          $injector.get('$auth').logout();
          $injector.get('$state').go('intro');
        }

        return $q.reject(response);
      }
    }
  });
})

.run(function($ionicPlatform, $rootScope, $ionicLoading, $state, $auth, pushService) {
  $ionicPlatform.ready(function() {
    if (navigator.notification) {
      window.alert = function (msg, cb, title, button) {
        var title = title || 'Projek';
        var button = button || 'Close';
        navigator.notification.alert(msg, cb, title, button);
      }
    }

    if (window.cordova) {
      cordova.getAppVersion.getVersionNumber().then(function (version) {
        $rootScope.appVersion = version;
      });
    } else {
      $rootScope.appVersion = 'web';
    }

    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

    pushService.hasPermission().then(function () {
      pushService.initOnce();
    });
  });

  $rootScope.$on('loading:show', function() {
    $ionicLoading.show({template: '<ion-spinner icon="lines"></ion-spinner><br><span>Loading</span>'})
  });

  $rootScope.$on('loading:hide', function() {
    $ionicLoading.hide()
  });

  $rootScope.$on('$stateChangeStart', function(event, next) {
    if ($auth.isAuthenticated()) {
      if (next.data && next.data.redirectIfAuth) {
        event.preventDefault();
        $state.go('tab.home');
      }
    } else {
      if (next.data && next.data.auth) {
        event.preventDefault();
        $state.go('intro');
      }
    }
  });
})

.factory('browserService', function() {
  return {
    openBrowser: function (data){

      // requires org.apache.cordova.inappbrowser
      if(window.cordova) {
        window.open(data.url, '_blank', 'location=no,hardwareback=no,enableViewportScale=yes');
      } else {
        window.open(data.url);
      }

    }
  }
})

.factory('youtube', function ($ionicPlatform, $window, YOUTUBE_KEY, browserService) {
  function extractYoutubeId (url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : false;
  }

  return {
    playVideo: function (url) {
      $ionicPlatform.ready(function () {
        var videoId = extractYoutubeId(url);
        if ($ionicPlatform.is('ios')) {
          YoutubeVideoPlayer.openVideo(videoId);
        } else if ($ionicPlatform.is('android')) {
          $window.youtube.init(YOUTUBE_KEY);
          $window.youtube.playVideo(videoId, 1, true, false);
        } else {
          browserService.openBrowser({
            url: url
          });
        }
      });
    }
  };
});
