// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('deepPocketsApp', ['ionic', 'ngCordova', 'deepPocketsApp.controllers', 'deepPocketsApp.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
	.state('login', {
		url: '/login',
		templateUrl : 'templates/login.html',
		controller  : 'LoginCtrl'
	})

	.state('app', {
		url:'/app',
		abstract: true,
		templateUrl : 'templates/tabs.html',
		controller  : 'AppCtrl'
	})
	
	.state('app.dashboard', {
		url:'/dashboard',
		views: {
			'dashboard': {
				templateUrl : 'templates/dashboard.html',
				controller  : 'DashboardCtrl'
			}
		}	

	})

	.state('app.accounts', {
		url:'/accounts',
		views: {
			'accounts': {
				templateUrl : 'templates/accounts.html',
				controller  : 'AccountsCtrl'                  
			}
		}
	})
	
	.state('app.records', {
		url:'/records/:id',
		views: {
			'accounts': {
				templateUrl : 'templates/records.html',
				controller  : 'RecordsCtrl'                  
			}
		}
	})

	.state('app.transaction', {
		url:'/transaction',
		views: {
			'transaction': {
				templateUrl : 'templates/transaction.html',
				controller  : 'TransactionCtrl'                  
			}
		}
	})

	.state('app.reports', {
		url: '/reports',
		views: {
			'reports': {
				templateUrl : 'templates/reports.html',
				controller  : 'ReportsCtrl'
			}
		}
	})

	.state('app.userprofile', {
		url: '/userprofile',
		views: {
			'userprofile': {
				templateUrl : 'templates/profile.html',
				controller  : 'ProfileCtrl'
		   }
		}
	})
	
	.state('app.settings', {
		url: '/settings',
		views: {
			'settings': {
				templateUrl : 'templates/settings.html',
				controller  : 'SettingsCtrl'
		   }
		}
	})
	
	.state('app.contactus', {
		url: '/contactus',
		views: {
			'contactus': {
				templateUrl : 'templates/contactus.html'
		   }
		}
	})
	
	.state('app.logout', {
		url: '/logout',
		views: {
			'logout': {
				templateUrl : 'templates/logout.html',
				controller  : 'LogoutCtrl'
		   }
		}
		
	});

	$urlRouterProvider.otherwise('/login');
});
