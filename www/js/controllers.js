angular.module('deepPocketsApp.controllers', [])

.controller('LoginCtrl', ['$scope', '$state', '$rootScope', '$localStorage', 'AuthFactory', 'accountsFactory',
	function ($scope, $state, $rootScope, $localStorage, AuthFactory, accountsFactory) {
	
	$scope.loginpage = true;
	$scope.register={};
    $scope.loginData={};
	$scope.disableLogin = false;
	$scope.disableRegister = false;
	
	$scope.loginData = $localStorage.getObject('deepPocketUserInfo','{}');
	var tokenData = $localStorage.getObject('deepPocketToken','{}');
	
	if (tokenData.token != null) {
		$state.go('app.dashboard');
	} else {
		$state.go('login');
	}
	
	$scope.togglePage = function() {
		$scope.loginpage = !$scope.loginpage;
		$scope.register={};
		$scope.loginData={};
	};
        
    $scope.doLogin = function() {
		$scope.disableLogin = true;
        $localStorage.storeObject('deepPocketUserInfo',$scope.loginData);
        AuthFactory.login($scope.loginData);
    };
    
    $scope.doRegister = function() {
		$scope.disableRegister = true;
		$scope.register.username = $scope.register.email;
        AuthFactory.register($scope.register);
    };
	
    $rootScope.$on('login:Successful', function () {
		if (AuthFactory.getJustRegistered() === true) {
			var account = {name:"Cash", description:"Cash on hand", type:"type_cash", number:"", balance:0};
			account.customerId = AuthFactory.getUserId();
			accountsFactory.saveAccount.save(account);
			AuthFactory.setJustRegistered(false);
			AuthFactory.notification('Registration successful');
		}
		$rootScope.loggedIn = AuthFactory.isAuthenticated();
		$scope.disableLogin = false;
		$scope.disableRegister = false;
		$state.go('app.dashboard');
    });
	
    $rootScope.$on('login:Failed', function () {
		$scope.disableLogin = false;
    });
        
    $rootScope.$on('registration:Successful', function () {
		$rootScope.loggedIn = AuthFactory.isAuthenticated();
    });
	
    $rootScope.$on('registration:Failed', function () {
		$scope.disableRegister = false;
    });
}])

.controller('AppCtrl', ['$scope', '$rootScope', 'AuthFactory', 'profileFactory', '$state',
	function ($scope, $rootScope, AuthFactory, profileFactory, $state) {

    $scope.loggedIn = false;
	var masterProfile;
	
	profileFactory.getProfile.get({
			id: AuthFactory.getUserId()
		})
		.$promise.then(
			function (response) {
				masterProfile = response;
				$rootScope.pic = masterProfile.wallpaper;
				$rootScope.colour = masterProfile.theme;
				if (masterProfile.currency === 'dollar') {$rootScope.symbol = '$ ';}
				else if (masterProfile.currency === 'euro') {$rootScope.symbol = '€ ';}
				else if (masterProfile.currency === 'rupee') {$rootScope.symbol = 'Rs. ';}
				var name = masterProfile.firstname + ' ' + masterProfile.lastname;
				AuthFactory.notification('Welcome '+ name +'..!!');
			},
			function () {
				AuthFactory.notification('Oops..!! Something snapped. Please Try later');
			}
		);    
}])

.controller('DashboardCtrl', ['$scope', '$rootScope', 'accountsFactory', 'AuthFactory',
	function ($scope, $rootScope, accountsFactory, AuthFactory) {
    
	$rootScope.page = "Dashboard";
	
	$scope.dataFailed = false;
	$scope.bankbalance = 0;
	$scope.creditbalance = 0;
	$scope.cashonhand = 0;
	$scope.loading = true;
	var accounts;
	
	var demo = {
		initChartist: function() {
			var ctx = document.getElementById("myChart");
			var myChart = new Chart(ctx, {
				type: 'doughnut',
				data: {
					labels: [
						"Bank Savings",
						"Virtual Cash",
						"Cash on Hand"
					],
					datasets: [
					{
						data: [$scope.bankbalance, $scope.creditbalance, $scope.cashonhand],
						backgroundColor: [
							"#FF6384",
							"#36A2EB",
							"#FFCE56"
						],
						hoverBackgroundColor: [
							"#FF6384",
							"#36A2EB",
							"#FFCE56"
						]
					}]
				}
			});
		}
	};

    accountsFactory.getAccounts.query({
            id: AuthFactory.getUserId()
        })
		.$promise.then(function (response) {
			accounts = response;
			var size = accounts.length;
			for (var i=0;i<size;i++) {
				if (accounts[i].type === 'type_bank') {$scope.bankbalance = $scope.bankbalance + accounts[i].balance;}
				else if (accounts[i].type === 'type_wallet') {$scope.creditbalance = $scope.creditbalance + accounts[i].balance;}
				else if (accounts[i].type === 'type_cash') {$scope.cashonhand = $scope.cashonhand + accounts[i].balance;}		
			}
			$scope.totalassets = $scope.bankbalance + $scope.creditbalance + $scope.cashonhand;
			if ($scope.totalassets != 0) {demo.initChartist();}
			$scope.loading = false;
		},
		function (response) {
			$scope.dataFailed = AuthFactory.handleError(response);
			$scope.loading = false;
		});	
}])

.controller('AccountsCtrl', ['$scope', '$rootScope', 'accountsFactory', 'AuthFactory', '$ionicPopover', '$ionicModal', 'transactionFactory',
	function ($scope, $rootScope, accountsFactory, AuthFactory, $ionicPopover, $ionicModal, transactionFactory) {
	
	$rootScope.page = "Accounts";
	$scope.dataFailed = false;
    $scope.tab = 1;
    $scope.filtText = "type_bank";
	
	$scope.loading = true;
    var demo = {
		initAccounts: function() {
			accountsFactory.getAccounts.query({
				id: AuthFactory.getUserId()
			})
			.$promise.then(function (response) {
				$scope.accounts = response;
				$scope.loading = false;
			},
			function (response) {
				$scope.dataFailed = AuthFactory.handleError(response);
				$scope.loading = false;
			});
		}
	}
	
	demo.initAccounts();
	
	$scope.setAccountNames = function(x, y) {
        $rootScope.accountName = x;
		$rootScope.accountNumber = y;
    };

    $scope.select = function (setTab) {
        $scope.tab = setTab;
		if (setTab === 1) {
            $scope.filtText = "type_bank";
        } else if (setTab === 2) {
            $scope.filtText = "type_wallet";
        } else if (setTab === 3) {
            $scope.filtText = "type_cash";
        }
    };

    $scope.isSelected = function (checkTab) {
        return ($scope.tab === checkTab);
    };
	
    $ionicPopover.fromTemplateUrl('templates/createAccount-popover.html', {
        scope: $scope
    }).then(function (popover) {
        $scope.popover = popover;
    });
	
	$scope.openPopover = function ($event) {
        $scope.popover.show($event);
    };
    $scope.closePopover = function () {
        $scope.popover.hide();
    };
    $scope.$on('$destroy', function () {
        $scope.popover.remove();
    });
    $scope.$on('popover.hidden', function () {
    });
    $scope.$on('popover.removed', function () {
    });
	
    $ionicModal.fromTemplateUrl('templates/createAccount.html', {
        scope: $scope,
		controller:"CreateAccountCtrl"
    }).then(function (modal) {
        $scope.createAccountForm = modal;
    });
    $scope.closeCreateAccountForm = function () {
        $scope.createAccountForm.hide();
    };
    $scope.showCreateAccountForm = function () {
        $scope.createAccountForm.show();
        $scope.popover.hide();
		$scope.account = {name: "", description: "", type: "", number: "", balance: 0};
		$scope.loading = false;
		$scope.createdisableButton = false;
    };
    $scope.createAccount = function () {
		$scope.createdisableButton = true;
		$scope.loading = true;
		$scope.account.customerId = AuthFactory.getUserId();
		accountsFactory.saveAccount.save($scope.account)
		.$promise.then(function (response) {
			var transaction = {name:'Account Created',type:'Initial Value',
			amount:response.balance,accountId:response.id,
			customerId:AuthFactory.getUserId(),balance:response.balance}; 
			transactionFactory.saveTransaction.save(transaction)
			.$promise.then(function () {
				$scope.loading = false;
				$scope.closeCreateAccountForm();
				demo.initAccounts();
				AuthFactory.notification('Account created successfully');		
			});
		}, function () {
			$scope.loading = false;
			$scope.closeCreateAccountForm();
			demo.initAccounts();
			AuthFactory.notification('Account creation Failed. Try again later');
		});
    };
}])

.controller('RecordsCtrl', ['$scope', '$rootScope', '$stateParams', 'transactionFactory', 'AuthFactory',
	function ($scope, $rootScope, $stateParams, transactionFactory, AuthFactory) {
		
	$rootScope.page = "Records";
	$scope.dataFailed = false;
	$scope.loading = true;
	transactionFactory.getTransactionsOfAccount.query({
            id: $stateParams.id
        })
        .$promise.then(
            function (response) {
                $scope.transactions = response;
				$scope.loading = false;
            },
            function (response) {
                $scope.dataFailed = AuthFactory.handleError(response);
				$scope.loading = false;
            }
        );
}])

.controller('TransactionCtrl', ['$scope', '$rootScope', 'accountsFactory', 'transactionFactory', 'AuthFactory',
	function ($scope, $rootScope, accountsFactory, transactionFactory, AuthFactory) {
		
	$rootScope.page = "Transaction";
	$scope.transaction = {};
	$scope.dataFailed = false;
	$scope.buttonDisabled = false;
	$scope.loading = false;
	
	accountsFactory.getAccounts.query({
            id: AuthFactory.getUserId()
        })
        .$promise.then(function (response) {
			$scope.froAccounts = response;
			$scope.toAccounts = angular.copy($scope.froAccounts);
		},
		function (response) {
			$scope.dataFailed = AuthFactory.handleError(response);
		});
	
	$scope.updateByType = function() {
		$scope.toAccounts = angular.copy($scope.froAccounts);
		$scope.transaction.fro = "";
		$scope.transaction.to = "";
	};
	
	$scope.updateByFro = function() {
		function checkId(x) {
			return x.id === $scope.transaction.fro.id;
		}
		$scope.toAccounts = angular.copy($scope.froAccounts);
		var index = $scope.toAccounts.findIndex(checkId);
		$scope.toAccounts.splice(index, 1);
	};
	
	$scope.submitTransaction = function () {
		$scope.buttonDisabled = true;
		$scope.loading = true;
		var transaction = $scope.transaction;
		transaction.customerId = AuthFactory.getUserId();
		
		if (transaction.type != 'Deposit') {
			if (transaction.amount > transaction.fro.balance) {
				AuthFactory.notification("Insufficient Balance in " + transaction.fro.name +
					". Available: "+transaction.fro.balance);
				$scope.loading = false;
				$scope.buttonDisabled = false;
				return;
			}
		}
		var froAccount = angular.copy(transaction.fro);
		var toAccount = angular.copy(transaction.to);
		transaction.fro = angular.copy(froAccount.name);
		transaction.to = angular.copy(toAccount.name);
		
		//Saving
		if (transaction.type === 'Deposit') {
			transaction.fro = "-";
			transaction.accountId = angular.copy(toAccount.id);
			transaction.balance = angular.copy(toAccount.balance + transaction.amount);
			transactionFactory.saveTransaction.save(transaction)
			.$promise.then(function () {
				accountsFactory.saveAccount.update({id:toAccount.id},{balance:transaction.balance});
				$scope.loading = false;
				$scope.buttonDisabled = false;
				AuthFactory.notification('Transaction processed successfully');
			}, function () {
				$scope.loading = false;
				$scope.buttonDisabled = false;
				AuthFactory.notification('Transaction failed. Try again later');
			});
		}
		else if (transaction.type === 'Expenditure') {
			if (transaction.category === 'Other') {transaction.category = $scope.other;}
			transaction.to = "-";
			transaction.accountId = angular.copy(froAccount.id);
			transaction.balance = angular.copy(froAccount.balance - transaction.amount);
			transactionFactory.saveTransaction.save(transaction)
			.$promise.then(function () {
				accountsFactory.saveAccount.update({id:froAccount.id},{balance:transaction.balance});
				$scope.loading = false;
				$scope.buttonDisabled = false;
				AuthFactory.notification('Transaction processed successfully');
			}, function () {
				$scope.loading = false;
				$scope.buttonDisabled = false;
				AuthFactory.notification('Transaction failed. Try again later');
			});
		}
		else if (transaction.type === 'Internal Transfer') {
			transaction.accountId = angular.copy(froAccount.id);
			transaction.balance = angular.copy(froAccount.balance - transaction.amount);
			transactionFactory.saveTransaction.save(transaction)
			.$promise.then(function () {
				accountsFactory.saveAccount.update({id:froAccount.id},{balance:transaction.balance})
				.$promise.then(function () {
					transaction.accountId = angular.copy(toAccount.id);
					transaction.balance = angular.copy(toAccount.balance + transaction.amount);
					transactionFactory.saveTransaction.save(transaction)
					.$promise.then(function () {
						accountsFactory.saveAccount.update({id:toAccount.id},{balance:transaction.balance});
						$scope.loading = false;
						$scope.buttonDisabled = false;
						AuthFactory.notification('Transaction processed successfully');
					});
				});
			}, function () {
				$scope.loading = false;
				$scope.buttonDisabled = false;
				AuthFactory.notification('Transaction failed. Try again later');
			});
		}
		$scope.transaction = {};
    };
}])

.controller('ReportsCtrl', ['$scope', '$rootScope', 'accountsFactory', 'AuthFactory', 'transactionFactory',
	function ($scope, $rootScope, accountsFactory, AuthFactory, transactionFactory) {
    
	$rootScope.page = "Reports";
	
	$scope.dataFailed = false;
	var bankbalance = 0;
	var creditbalance = 0;
	var cashonhand = 0;
	var accounts;
	
	var pie = {
		initChartist: function() {
			var myPie = document.getElementById("myPie");
			var myPie = new Chart(myPie, {
				type: 'doughnut',
				data: {
					labels: [
						"Bank Savings",
						"Virtual Cash",
						"Cash on Hand"
					],
					datasets: [
					{
						data: [bankbalance, creditbalance, cashonhand],
						backgroundColor: [
							"#FF6384",
							"#36A2EB",
							"#FFCE56"
						],
						hoverBackgroundColor: [
							"#FF6384",
							"#36A2EB",
							"#FFCE56"
						]
					}]
				}
			});
		}
	};
	
	$scope.loading = true;
    accountsFactory.getAccounts.query({
            id: AuthFactory.getUserId()
        })
		.$promise.then(function (response) {
			accounts = response;
			$scope.Accounts = accounts;
			for (var i=0;i<accounts.length;i++) {
				if (accounts[i].type === 'type_bank') {bankbalance = bankbalance + accounts[i].balance;}
				else if (accounts[i].type === 'type_wallet') {creditbalance = creditbalance + accounts[i].balance;}
				else if (accounts[i].type === 'type_cash') {cashonhand = cashonhand + accounts[i].balance;}	
			}
			var totalassets = bankbalance + creditbalance + cashonhand;
			if (totalassets != 0) {pie.initChartist();}
			$scope.loading = false;
		},
		function (response) {
			$scope.loading = false;
			$scope.dataFailed = AuthFactory.handleError(response);
		});
		
	var line = {
		initChartist: function() {
			var series = [];
			var labels = [];
			for (var i=0; i<transactions.length; i++) {
				series.push(transactions[i].balance);
				var date = new Date(transactions[i].createdAt);
				labels.push(date.getDate()+'/'+date.getMonth());
			}
			var myLine = document.getElementById("myLine");
			var myLine = new Chart(myLine, {
				type: 'line',
				data: {
					labels: labels,
					datasets: [
						{
							label: name,
							lineTension: 0.1,
							backgroundColor: "rgba(75,192,192,0.4)",
							borderColor: "rgba(75,192,192,1)",
							borderCapStyle: 'butt',
							borderDash: [],
							borderDashOffset: 0.0,
							borderJoinStyle: 'miter',
							pointBorderColor: "rgba(75,192,192,1)",
							pointBackgroundColor: "#fff",
							pointBorderWidth: 1,
							pointHoverRadius: 5,
							pointHoverBackgroundColor: "rgba(75,192,192,1)",
							pointHoverBorderColor: "rgba(220,220,220,1)",
							pointHoverBorderWidth: 2,
							pointRadius: 1,
							pointHitRadius: 10,
							data: series,
							spanGaps: false,
						}
					]
				}
			});
		}
	};
		
	var transactions;
	var name;
	$scope.drawGraph = function(reportSelection) {
		name = reportSelection.name;
		$scope.lineloading = true;
		transactionFactory.getTransactionsOfAccount.query({
				id: reportSelection.id,
				filter:{"order":"createdAt"}
			})
			.$promise.then(
				function (response) {
					transactions = response;
					line.initChartist();
					$scope.lineloading = false;
				},
				function (response) {
					$scope.lineloading = false;
					$scope.dataFailed = AuthFactory.handleError(response);
				}
			);
	};
}])

.controller('ProfileCtrl', ['$scope', '$rootScope', 'profileFactory', 'AuthFactory',
	function ($scope, $rootScope, profileFactory, AuthFactory) {

	$rootScope.page = "User Profile";
	$scope.masterProfile = {};
	$scope.dataFailed = false;
	
	$scope.avatars = ["img/faces/face-0.jpg","img/faces/face-1.jpg","img/faces/face-2.jpg",
				"img/faces/face-3.jpg","img/faces/face-4.jpg","img/faces/face-5.jpg",
				"img/faces/face-6.jpg","img/faces/face-7.jpg"];
				
	$scope.setAvatar = function (x) {
		$scope.slaveProfile.avatar = x;
    };
	
	$scope.loading = true;
	profileFactory.getProfile.get({
				id: AuthFactory.getUserId()
			})
			.$promise.then(
				function (response) {
					$scope.masterProfile = response;
					$scope.loading = false;
				},
				function (response) {
					$scope.loading = false;
					$scope.dataFailed = AuthFactory.handleError(response);
				}
			);
		
	$scope.edit = false;
	
	$scope.editProfile = function () {
		$scope.edit = true;
		$scope.slaveProfile = angular.copy($scope.masterProfile);
	};
	
    $scope.updateProfile = function () {
		console.log("update");
		$scope.disablebutton = true;
		$scope.loading = true;
		var finalProfile = {};
		finalProfile.avatar = $scope.slaveProfile.avatar;
		finalProfile.firstname = $scope.slaveProfile.firstname;
		finalProfile.lastname = $scope.slaveProfile.lastname;
		finalProfile.address = $scope.slaveProfile.address;
		finalProfile.city = $scope.slaveProfile.city;
		finalProfile.country = $scope.slaveProfile.country;
		finalProfile.pincode = $scope.slaveProfile.pincode;
		profileFactory.getProfile.update({id:$scope.masterProfile.id},finalProfile)
		.$promise.then(function () {
			$scope.masterProfile = angular.copy($scope.slaveProfile);
			$scope.loading = false;
			$scope.disablebutton = false;
			$scope.edit = false;
			AuthFactory.notification('Profile updated successfully');
		}, function () {
			$scope.loading = false;
			$scope.disablebutton = false;
			$scope.edit = false;
			AuthFactory.notification('Profile update failed. Try again later');
		});
    };
	
	$scope.cancelEdit = function () {
		console.log("cancel");
		$scope.slaveProfile = angular.copy($scope.masterProfile);
		$scope.loading = false;
		$scope.disablebutton = false;
		$scope.edit = false;
    };
}])

.controller('SettingsCtrl', ['$rootScope', '$scope', 'profileFactory', 'AuthFactory', '$state',
	function ($rootScope, $scope, profileFactory, AuthFactory, $state) {
		
	$rootScope.page = "Settings";
	
	$scope.pictures = ["img/sidebar0.jpg","img/sidebar1.jpg","img/sidebar2.jpg","img/sidebar3.jpg","img/sidebar4.jpg","img/sidebar5.jpg"];
	
	var finalProfile = {};

    $scope.setColour = function (colour) {
		$rootScope.g = 'tabs-icon-top tabs-color-active-balanced'
		$rootScope.colour = colour;
		finalProfile.theme = colour;
    };
	
	$scope.setPicture = function (pic) {
		$rootScope.pic = pic;
		finalProfile.wallpaper = pic;
    };
	
	$scope.updateSettings = function () {
		$scope.disablebutton = true;
		$scope.loading = true;
		profileFactory.getProfile.update({id:AuthFactory.getUserId()}, finalProfile)
		.$promise.then(function () {
			$scope.loading = false;
			$scope.disablebutton = false;
			AuthFactory.notification('Visuals updated successfully');
		}, function () {
			$scope.loading = false;
			$scope.disablebutton = false;
			AuthFactory.notification('Visuals update failed. Try again later');
		});
    };
}])

.controller('LogoutCtrl', ['$rootScope', '$scope', 'profileFactory', 'AuthFactory', '$state',
	function ($rootScope, $scope, profileFactory, AuthFactory, $state) {
    AuthFactory.logout();
    $rootScope.loggedIn = false;
}])
;
