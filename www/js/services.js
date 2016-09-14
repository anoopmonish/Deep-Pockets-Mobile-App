angular.module('deepPocketsApp.services', ['ngResource'])
.constant("baseURL", "http://deeppocketsnode.mybluemix.net/api/")

.factory('accountsFactory', ['$resource', 'baseURL',
	function ($resource, baseURL) {

	var accountFac = {};
	
	accountFac.getAccounts = $resource(baseURL + "Customers/:id/accounts", null, {
		'update': { method: 'PUT' }
	});
	
	accountFac.saveAccount = $resource(baseURL + "Accounts/:id", null, {
		'update': { method: 'PUT' }
	});
	
	return accountFac;
}])

.factory('transactionFactory', ['$resource', 'baseURL', function ($resource, baseURL) {
	var transactFac = {};
	
	transactFac.getTransactionsOfAccount = $resource(baseURL + "Accounts/:id/transactions", null, {
		'update': { method: 'PUT' }
	});
	
	transactFac.getTransactions = $resource(baseURL + "Customers/:id/transactions", null, {
		'update': { method: 'PUT' }
	});
	
	transactFac.saveTransaction = $resource(baseURL + "Transactions/:id", null, {
		'update': { method: 'PUT' }
	});
	return transactFac;
}])

.factory('profileFactory', ['$resource', 'baseURL', function ($resource, baseURL) {
	var proFac = {};
	
	proFac.getProfile = $resource(baseURL + "Customers/:id", null, {
		'update': { method: 'PUT' }
	});
	
	return proFac;
}])

.factory('$localStorage', ['$window', function ($window) {
    return {
        store: function (key, value) {
            $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        remove: function (key) {
            $window.localStorage.removeItem(key);
        },
        storeObject: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key, defaultValue) {
            return JSON.parse($window.localStorage[key] || defaultValue);
        }
    };
}])

.factory('AuthFactory', ['$resource', '$http', '$localStorage', '$rootScope', '$window', 'baseURL', 
'$ionicPopup', '$state', '$cordovaToast',
	function($resource, $http, $localStorage, $rootScope, $window, baseURL, $ionicPopup, $state, $cordovaToast){
    
    var authFac = {};
    var TOKEN_KEY = 'deepPocketToken';
    var isAuthenticated = false;
    var username = '';
	var userId = '';
    var authToken;
	var justRegistered = false;
	
	function useCredentials(credentials) {
		isAuthenticated = true;
		username = credentials.username;
		userId = credentials.userId;
		authToken = credentials.token;
		$http.defaults.headers.common['x-access-token'] = authToken;
	}

	function loadUserCredentials() {
		var credentials = $localStorage.getObject(TOKEN_KEY,'{}');
		if (credentials.username != undefined) {
			useCredentials(credentials);
		}
	}

	function storeUserCredentials(credentials) {
		$localStorage.storeObject(TOKEN_KEY, credentials);
		useCredentials(credentials);
	}

	function destroyUserCredentials() {
		authToken = undefined;
		username = '';
		userId = '';
		isAuthenticated = false;
		$http.defaults.headers.common['x-access-token'] = authToken;
		$localStorage.remove(TOKEN_KEY);
	}
     
    authFac.login = function(loginData) {
        $resource(baseURL + "Customers/login")
        .save(loginData,
           function(response) {
              storeUserCredentials({username:loginData.username, userId:response.userId, token: response.id});
              $rootScope.$broadcast('login:Successful');
           },
           function(response){
				isAuthenticated = false;
				if(response.data === null) {
					authFac.popMessage("No Internet Connection", "Please try again later");
				}
				else if (response.data.error.statusCode === 401) {
					authFac.popMessage("Login Failed", "Please verify your credentials");
				}
				$rootScope.$broadcast('login:Failed');
           }
        );
    };
    
    authFac.logout = function() {
		console.log("logging out");
        $resource(baseURL + "Customers/logout").save(function(){});
        destroyUserCredentials();
		authFac.popMessage("Logout Successful", "");
		$state.go('login');
    };
    
    authFac.register = function(registerData) {
        $resource(baseURL + "Customers")
        .save(registerData,
			function() {
				justRegistered = true;
				authFac.login({username:registerData.username, password:registerData.password});
				$localStorage.storeObject('deepPocketUserInfo',
						{username:registerData.username, password:registerData.password});
				$rootScope.$broadcast('registration:Successful');
			},
			function(response){
				if(response.data === null) {
					authFac.popMessage("No Internet Connection", "Please try again later");
				}
				else {
					var message = response.data.error.details.messages.email;
					authFac.popMessage("Registration Failed",message);
				}
				$rootScope.$broadcast('registration:Failed');
			}
        );
    };
	
	authFac.handleError = function(response) {
		if(response.data === null) {
			return true;
		}
		else if (response.data.error.statusCode === 401) {
			destroyUserCredentials();
			$rootScope.loggedIn = false;
			$state.go('login');
			authFac.popMessage("Session Expired", "Please login again");
		}
	};
	
    authFac.popMessage = function(head, body) {
		var alertPopup = $ionicPopup.alert({
                title: head,
                template: body
            });
    };
    
    authFac.isAuthenticated = function() {
        return isAuthenticated;
    };
    
    authFac.getUsername = function() {
        return username;  
    };
	
    authFac.getUserId = function() {
        return userId;  
    };
	
    authFac.getJustRegistered = function() {
        return justRegistered;  
    };
	
    authFac.setJustRegistered = function(x) {
        justRegistered = x;  
    };
	
	authFac.notification = function(x) {
		$cordovaToast
			.show(x, 'long', 'bottom')
			.then(function(success) {
			  // success
			}, function (error) {
			  // error
			});
	};

    loadUserCredentials();
    
    return authFac;
    
}])
;