# Mobile Testing Patterns

This document provides comprehensive testing patterns for mobile applications across React Native, Flutter, and native iOS/Android platforms.

---

## Mobile Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────────┐
│                    E2E Tests (10%)                                  │
│        (Detox, XCUITest, Espresso, Appium)                         │
│        Critical user journeys, cross-platform flows                 │
├─────────────────────────────────────────────────────────────────────┤
│               Integration Tests (30%)                               │
│        (API integration, navigation, state management)              │
├─────────────────────────────────────────────────────────────────────┤
│                  Unit Tests (60%)                                   │
│        (Components, hooks, utilities, business logic)               │
│        (Jest, RNTL, XCTest, flutter_test)                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## React Native Testing

### Setup

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native jest @types/jest
npm install --save-dev detox jest-circus

# Initialize Detox
npx detox init
```

### Unit Testing with React Native Testing Library

```typescript
// __tests__/components/UserProfile.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { UserProfile } from '@/components/UserProfile';
import { UserFactory } from '@/tests/factories';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display user name and email', () => {
    // Arrange
    const user = UserFactory.build({
      name: 'John Doe',
      email: 'john@example.com'
    });

    // Act
    render(<UserProfile user={user} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('john@example.com')).toBeTruthy();
  });

  it('should navigate to edit screen on press', () => {
    // Arrange
    const user = UserFactory.build();
    render(<UserProfile user={user} />);

    // Act
    fireEvent.press(screen.getByRole('button', { name: /edit/i }));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('EditProfile', { userId: user.id });
  });

  it('should show loading state while fetching', () => {
    // Arrange & Act
    render(<UserProfile userId="123" />);

    // Assert
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should handle async data fetching', async () => {
    // Arrange
    const user = UserFactory.build();
    jest.spyOn(api, 'getUser').mockResolvedValue(user);

    // Act
    render(<UserProfile userId={user.id} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(user.name)).toBeTruthy();
    });
  });
});
```

### Testing Hooks

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/providers/AuthProvider';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  it('should login user successfully', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Act
    await act(async () => {
      await result.current.login('user@example.com', 'password');
    });

    // Assert
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('user@example.com');
  });

  it('should handle login error', async () => {
    // Arrange
    jest.spyOn(api, 'login').mockRejectedValue(new Error('Invalid credentials'));
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Act
    await act(async () => {
      await result.current.login('user@example.com', 'wrong');
    });

    // Assert
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });
});
```

### Detox E2E Testing

```javascript
// e2e/firstTest.e2e.js
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully with valid credentials', async () => {
    // Navigate to login
    await expect(element(by.id('login-screen'))).toBeVisible();

    // Enter credentials
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('password123');

    // Tap login button
    await element(by.id('login-button')).tap();

    // Verify navigation to home
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify welcome message
    await expect(element(by.text('Welcome back!'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('error-message')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.text('Invalid email or password'))).toBeVisible();
  });

  it('should handle biometric authentication', async () => {
    // Enable biometric in settings first
    await element(by.id('settings-tab')).tap();
    await element(by.id('enable-biometric')).tap();

    // Logout and try biometric login
    await element(by.id('logout-button')).tap();
    await element(by.id('biometric-login-button')).tap();

    // Simulate successful biometric
    await device.setBiometricEnrollment(true);
    await device.matchFace(); // or matchFinger() for Touch ID

    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});

// e2e/checkout.e2e.js
describe('Checkout Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAsTestUser();
  });

  it('should complete purchase flow', async () => {
    // Add item to cart
    await element(by.id('product-list')).scroll(200, 'down');
    await element(by.id('product-item-1')).tap();
    await element(by.id('add-to-cart')).tap();

    // Go to cart
    await element(by.id('cart-tab')).tap();
    await expect(element(by.id('cart-item-count'))).toHaveText('1');

    // Proceed to checkout
    await element(by.id('checkout-button')).tap();

    // Fill shipping address
    await element(by.id('address-input')).typeText('123 Test St');
    await element(by.id('city-input')).typeText('Test City');
    await element(by.id('zip-input')).typeText('12345');

    // Continue to payment
    await element(by.id('continue-button')).tap();

    // Enter payment details
    await element(by.id('card-number')).typeText('4242424242424242');
    await element(by.id('expiry')).typeText('1225');
    await element(by.id('cvc')).typeText('123');

    // Place order
    await element(by.id('place-order-button')).tap();

    // Verify success
    await waitFor(element(by.id('order-confirmation')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.text('Order Confirmed!'))).toBeVisible();
  });
});
```

### Detox Configuration

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 14' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_5_API_31' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

---

## Flutter Testing

### Unit Tests (flutter_test)

```dart
// test/models/user_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:myapp/models/user.dart';
import '../factories/user_factory.dart';

void main() {
  group('User', () {
    test('should create user from JSON', () {
      // Arrange
      final json = {
        'id': '123',
        'email': 'user@example.com',
        'name': 'John Doe',
      };

      // Act
      final user = User.fromJson(json);

      // Assert
      expect(user.id, '123');
      expect(user.email, 'user@example.com');
      expect(user.name, 'John Doe');
    });

    test('should convert user to JSON', () {
      // Arrange
      final user = UserFactory.build(
        id: '123',
        email: 'user@example.com',
        name: 'John Doe',
      );

      // Act
      final json = user.toJson();

      // Assert
      expect(json['id'], '123');
      expect(json['email'], 'user@example.com');
    });

    test('should validate email format', () {
      // Arrange & Act & Assert
      expect(User.isValidEmail('user@example.com'), true);
      expect(User.isValidEmail('invalid-email'), false);
      expect(User.isValidEmail(''), false);
    });
  });
}
```

### Widget Tests

```dart
// test/widgets/user_profile_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:myapp/widgets/user_profile.dart';
import 'package:myapp/providers/user_provider.dart';
import '../factories/user_factory.dart';

class MockUserProvider extends Mock implements UserProvider {}

void main() {
  late MockUserProvider mockUserProvider;

  setUp(() {
    mockUserProvider = MockUserProvider();
  });

  group('UserProfile', () {
    testWidgets('should display user name and email', (tester) async {
      // Arrange
      final user = UserFactory.build(
        name: 'John Doe',
        email: 'john@example.com',
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: UserProfile(user: user),
        ),
      );

      // Assert
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('john@example.com'), findsOneWidget);
    });

    testWidgets('should show loading indicator while fetching', (tester) async {
      // Arrange
      when(() => mockUserProvider.isLoading).thenReturn(true);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<UserProvider>.value(
            value: mockUserProvider,
            child: const UserProfileScreen(),
          ),
        ),
      );

      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should navigate to edit screen on tap', (tester) async {
      // Arrange
      final user = UserFactory.build();
      bool navigated = false;

      await tester.pumpWidget(
        MaterialApp(
          home: UserProfile(
            user: user,
            onEditTap: () => navigated = true,
          ),
        ),
      );

      // Act
      await tester.tap(find.byKey(const Key('edit-button')));
      await tester.pump();

      // Assert
      expect(navigated, true);
    });

    testWidgets('should handle gestures correctly', (tester) async {
      // Arrange
      final user = UserFactory.build();
      int swipeCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: UserProfile(
            user: user,
            onSwipeLeft: () => swipeCount++,
          ),
        ),
      );

      // Act - Swipe left
      await tester.drag(find.byType(UserProfile), const Offset(-300, 0));
      await tester.pumpAndSettle();

      // Assert
      expect(swipeCount, 1);
    });
  });
}
```

### Integration Tests

```dart
// integration_test/app_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:myapp/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Authentication Flow', () {
    testWidgets('should login successfully', (tester) async {
      // Launch app
      app.main();
      await tester.pumpAndSettle();

      // Verify login screen is visible
      expect(find.byKey(const Key('login-screen')), findsOneWidget);

      // Enter credentials
      await tester.enterText(
        find.byKey(const Key('email-input')),
        'user@example.com',
      );
      await tester.enterText(
        find.byKey(const Key('password-input')),
        'password123',
      );

      // Tap login button
      await tester.tap(find.byKey(const Key('login-button')));
      await tester.pumpAndSettle();

      // Verify home screen is visible
      expect(find.byKey(const Key('home-screen')), findsOneWidget);
      expect(find.text('Welcome back!'), findsOneWidget);
    });

    testWidgets('should handle biometric login', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Tap biometric login
      await tester.tap(find.byKey(const Key('biometric-button')));
      await tester.pumpAndSettle();

      // Note: Actual biometric simulation requires platform-specific setup
      // In CI, mock the biometric service
    });
  });

  group('Checkout Flow', () {
    testWidgets('should complete purchase', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Login first
      await performLogin(tester);

      // Navigate to products
      await tester.tap(find.byKey(const Key('products-tab')));
      await tester.pumpAndSettle();

      // Add item to cart
      await tester.tap(find.byKey(const Key('product-0')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('add-to-cart')));
      await tester.pumpAndSettle();

      // Go to cart
      await tester.tap(find.byKey(const Key('cart-tab')));
      await tester.pumpAndSettle();

      // Proceed to checkout
      await tester.tap(find.byKey(const Key('checkout-button')));
      await tester.pumpAndSettle();

      // Fill payment details
      await tester.enterText(
        find.byKey(const Key('card-number')),
        '4242424242424242',
      );
      await tester.enterText(find.byKey(const Key('expiry')), '12/25');
      await tester.enterText(find.byKey(const Key('cvc')), '123');

      // Place order
      await tester.tap(find.byKey(const Key('place-order')));
      await tester.pumpAndSettle();

      // Verify confirmation
      expect(find.text('Order Confirmed!'), findsOneWidget);
    });
  });
}

Future<void> performLogin(WidgetTester tester) async {
  await tester.enterText(
    find.byKey(const Key('email-input')),
    'user@example.com',
  );
  await tester.enterText(
    find.byKey(const Key('password-input')),
    'password123',
  );
  await tester.tap(find.byKey(const Key('login-button')));
  await tester.pumpAndSettle();
}
```

### Flutter Factory Pattern

```dart
// test/factories/user_factory.dart
import 'package:faker/faker.dart';
import 'package:myapp/models/user.dart';

class UserFactory {
  static final _faker = Faker();
  static int _sequence = 0;

  static User build({
    String? id,
    String? email,
    String? name,
    String? role,
    bool? isActive,
  }) {
    _sequence++;
    return User(
      id: id ?? 'usr_$_sequence',
      email: email ?? _faker.internet.email(),
      name: name ?? _faker.person.name(),
      role: role ?? 'user',
      isActive: isActive ?? true,
    );
  }

  static List<User> buildList(int count) {
    return List.generate(count, (_) => build());
  }
}
```

---

## Native iOS Testing (XCTest)

### Unit Tests

```swift
// Tests/UserServiceTests.swift
import XCTest
@testable import MyApp

final class UserServiceTests: XCTestCase {
    var sut: UserService!
    var mockRepository: MockUserRepository!

    override func setUp() {
        super.setUp()
        mockRepository = MockUserRepository()
        sut = UserService(repository: mockRepository)
    }

    override func tearDown() {
        sut = nil
        mockRepository = nil
        super.tearDown()
    }

    func testGetUser_WhenUserExists_ReturnsUser() async throws {
        // Arrange
        let expectedUser = UserFactory.build(id: "123", name: "John Doe")
        mockRepository.stubbedFindByIdResult = expectedUser

        // Act
        let user = try await sut.getUser(id: "123")

        // Assert
        XCTAssertEqual(user.id, "123")
        XCTAssertEqual(user.name, "John Doe")
        XCTAssertEqual(mockRepository.findByIdCallCount, 1)
    }

    func testGetUser_WhenUserNotFound_ThrowsError() async {
        // Arrange
        mockRepository.stubbedFindByIdResult = nil

        // Act & Assert
        do {
            _ = try await sut.getUser(id: "999")
            XCTFail("Expected UserNotFoundError")
        } catch {
            XCTAssertTrue(error is UserNotFoundError)
        }
    }

    func testCreateUser_HashesPassword() async throws {
        // Arrange
        let userData = UserFactory.buildInput(password: "plainPassword")

        // Act
        let user = try await sut.createUser(userData)

        // Assert
        XCTAssertNotEqual(user.passwordHash, "plainPassword")
        XCTAssertTrue(user.passwordHash.hasPrefix("$2a$"))
    }
}
```

### UI Tests (XCUITest)

```swift
// UITests/AuthenticationUITests.swift
import XCTest

final class AuthenticationUITests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }

    func testLoginWithValidCredentials() {
        // Navigate to login
        let loginScreen = app.otherElements["login-screen"]
        XCTAssertTrue(loginScreen.waitForExistence(timeout: 5))

        // Enter credentials
        let emailField = app.textFields["email-input"]
        emailField.tap()
        emailField.typeText("user@example.com")

        let passwordField = app.secureTextFields["password-input"]
        passwordField.tap()
        passwordField.typeText("password123")

        // Tap login
        app.buttons["login-button"].tap()

        // Verify home screen
        let homeScreen = app.otherElements["home-screen"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Welcome back!"].exists)
    }

    func testLoginWithInvalidCredentials() {
        let emailField = app.textFields["email-input"]
        emailField.tap()
        emailField.typeText("user@example.com")

        let passwordField = app.secureTextFields["password-input"]
        passwordField.tap()
        passwordField.typeText("wrongpassword")

        app.buttons["login-button"].tap()

        // Verify error message
        let errorMessage = app.staticTexts["error-message"]
        XCTAssertTrue(errorMessage.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Invalid email or password"].exists)
    }

    func testBiometricLogin() {
        // Tap biometric button
        app.buttons["biometric-login"].tap()

        // Simulate Face ID
        // Note: Requires "Enrolled" in Simulator Features > Face ID
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let matchButton = springboard.buttons["Matching Face"]

        if matchButton.waitForExistence(timeout: 5) {
            matchButton.tap()
        }

        // Verify success
        let homeScreen = app.otherElements["home-screen"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 10))
    }

    func testSwipeToDelete() {
        // Navigate to list
        app.tabBars.buttons["Items"].tap()

        // Swipe to delete
        let cell = app.cells["item-cell-0"]
        cell.swipeLeft()

        let deleteButton = app.buttons["Delete"]
        XCTAssertTrue(deleteButton.exists)
        deleteButton.tap()

        // Verify deletion
        XCTAssertFalse(cell.exists)
    }
}
```

---

## Native Android Testing (Espresso)

### Unit Tests

```kotlin
// app/src/test/java/com/example/UserServiceTest.kt
package com.example.myapp

import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.*
import org.assertj.core.api.Assertions.*

class UserServiceTest {
    private lateinit var mockRepository: UserRepository
    private lateinit var userService: UserService

    @BeforeEach
    fun setUp() {
        mockRepository = mockk()
        userService = UserService(mockRepository)
    }

    @AfterEach
    fun tearDown() {
        clearAllMocks()
    }

    @Test
    fun `getUser should return user when exists`() = runTest {
        // Arrange
        val expectedUser = UserFactory.build(id = "123", name = "John Doe")
        coEvery { mockRepository.findById("123") } returns expectedUser

        // Act
        val user = userService.getUser("123")

        // Assert
        assertThat(user.id).isEqualTo("123")
        assertThat(user.name).isEqualTo("John Doe")
        coVerify { mockRepository.findById("123") }
    }

    @Test
    fun `getUser should throw when user not found`() = runTest {
        // Arrange
        coEvery { mockRepository.findById("999") } returns null

        // Act & Assert
        assertThatThrownBy { runBlocking { userService.getUser("999") } }
            .isInstanceOf(UserNotFoundException::class.java)
    }
}
```

### Espresso UI Tests

```kotlin
// app/src/androidTest/java/com/example/AuthenticationTest.kt
package com.example.myapp

import androidx.test.espresso.Espresso.*
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.*
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.hamcrest.Matchers.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AuthenticationTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun loginWithValidCredentials_navigatesToHome() {
        // Verify login screen is displayed
        onView(withId(R.id.login_screen))
            .check(matches(isDisplayed()))

        // Enter credentials
        onView(withId(R.id.email_input))
            .perform(typeText("user@example.com"), closeSoftKeyboard())

        onView(withId(R.id.password_input))
            .perform(typeText("password123"), closeSoftKeyboard())

        // Tap login
        onView(withId(R.id.login_button))
            .perform(click())

        // Verify home screen
        onView(withId(R.id.home_screen))
            .check(matches(isDisplayed()))

        onView(withText("Welcome back!"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun loginWithInvalidCredentials_showsError() {
        onView(withId(R.id.email_input))
            .perform(typeText("user@example.com"), closeSoftKeyboard())

        onView(withId(R.id.password_input))
            .perform(typeText("wrongpassword"), closeSoftKeyboard())

        onView(withId(R.id.login_button))
            .perform(click())

        // Verify error message
        onView(withId(R.id.error_message))
            .check(matches(isDisplayed()))

        onView(withText("Invalid email or password"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun swipeToRefresh_reloadsData() {
        // Navigate to list
        onView(withId(R.id.items_tab))
            .perform(click())

        // Swipe to refresh
        onView(withId(R.id.swipe_refresh))
            .perform(swipeDown())

        // Verify loading indicator
        onView(withId(R.id.progress_bar))
            .check(matches(isDisplayed()))
    }

    @Test
    fun recyclerViewScroll_loadsMoreItems() {
        onView(withId(R.id.items_tab))
            .perform(click())

        // Scroll to bottom
        onView(withId(R.id.recycler_view))
            .perform(RecyclerViewActions.scrollToPosition<RecyclerView.ViewHolder>(19))

        // Verify more items loaded
        onView(withId(R.id.recycler_view))
            .check(matches(hasMinimumChildCount(20)))
    }
}
```

### UI Automator (Cross-App Testing)

```kotlin
// app/src/androidTest/java/com/example/CrossAppTest.kt
package com.example.myapp

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.*
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

class CrossAppTest {
    private lateinit var device: UiDevice

    @Before
    fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        device.pressHome()
    }

    @Test
    fun handleDeepLink() {
        // Open deep link (simulates user clicking link in another app)
        device.executeShellCommand("am start -a android.intent.action.VIEW -d 'myapp://product/123'")

        // Wait for app to open
        device.wait(Until.hasObject(By.pkg("com.example.myapp")), 5000)

        // Verify product screen is shown
        val productScreen = device.findObject(UiSelector().resourceId("com.example.myapp:id/product_screen"))
        assertTrue(productScreen.exists())
    }

    @Test
    fun handleNotificationTap() {
        // Trigger test notification
        device.executeShellCommand("am broadcast -a com.example.myapp.TEST_NOTIFICATION")

        // Open notification shade
        device.openNotification()
        device.wait(Until.hasObject(By.text("New Message")), 5000)

        // Tap notification
        val notification = device.findObject(UiSelector().text("New Message"))
        notification.click()

        // Verify app opened to correct screen
        device.wait(Until.hasObject(By.pkg("com.example.myapp")), 5000)
        val messageScreen = device.findObject(UiSelector().resourceId("com.example.myapp:id/message_screen"))
        assertTrue(messageScreen.exists())
    }
}
```

---

## Appium (Cross-Platform)

### Setup

```bash
npm install --save-dev webdriverio @wdio/appium-service
npx appium driver install uiautomator2
npx appium driver install xcuitest
```

### Configuration

```typescript
// wdio.conf.ts
import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./test/specs/**/*.ts'],
  capabilities: [
    {
      platformName: 'iOS',
      'appium:deviceName': 'iPhone 14',
      'appium:platformVersion': '16.0',
      'appium:app': './apps/MyApp.app',
      'appium:automationName': 'XCUITest',
    },
    {
      platformName: 'Android',
      'appium:deviceName': 'Pixel 5',
      'appium:platformVersion': '13',
      'appium:app': './apps/app-debug.apk',
      'appium:automationName': 'UiAutomator2',
    },
  ],
  services: ['appium'],
  framework: 'mocha',
  reporters: ['spec'],
};
```

### Cross-Platform Tests

```typescript
// test/specs/auth.spec.ts
describe('Authentication', () => {
  it('should login successfully', async () => {
    // Works on both iOS and Android
    const emailInput = await $('~email-input');
    await emailInput.setValue('user@example.com');

    const passwordInput = await $('~password-input');
    await passwordInput.setValue('password123');

    const loginButton = await $('~login-button');
    await loginButton.click();

    // Wait for home screen
    const homeScreen = await $('~home-screen');
    await homeScreen.waitForDisplayed({ timeout: 10000 });

    const welcomeText = await $('~welcome-text');
    await expect(welcomeText).toHaveText('Welcome back!');
  });

  it('should handle platform-specific gestures', async () => {
    if (driver.isIOS) {
      // iOS swipe
      await driver.execute('mobile: swipe', {
        direction: 'left',
        element: await $('~swipeable-card'),
      });
    } else {
      // Android swipe
      await driver.execute('mobile: swipeGesture', {
        left: 500,
        top: 500,
        width: 200,
        height: 0,
        direction: 'left',
        percent: 0.75,
      });
    }
  });

  it('should handle native alerts', async () => {
    const deleteButton = await $('~delete-button');
    await deleteButton.click();

    // Handle native alert
    if (driver.isIOS) {
      const confirmButton = await $('-ios class chain:**/XCUIElementTypeButton[`label == "Confirm"`]');
      await confirmButton.click();
    } else {
      const confirmButton = await $('android=new UiSelector().text("Confirm")');
      await confirmButton.click();
    }
  });
});
```

### Page Objects for Appium

```typescript
// test/pageObjects/LoginPage.ts
class LoginPage {
  get emailInput() {
    return $('~email-input');
  }

  get passwordInput() {
    return $('~password-input');
  }

  get loginButton() {
    return $('~login-button');
  }

  get errorMessage() {
    return $('~error-message');
  }

  async login(email: string, password: string) {
    await this.emailInput.setValue(email);
    await this.passwordInput.setValue(password);
    await this.loginButton.click();
  }

  async getErrorText() {
    await this.errorMessage.waitForDisplayed();
    return this.errorMessage.getText();
  }
}

export default new LoginPage();
```

---

## Mobile-Specific Considerations

### Testing Gestures

```typescript
// React Native / Detox
await element(by.id('swipeable')).swipe('left', 'fast');
await element(by.id('pinchable')).pinch(0.5);
await element(by.id('scrollable')).scroll(200, 'down');

// Flutter
await tester.drag(find.byKey(Key('slider')), const Offset(100, 0));
await tester.fling(find.byType(ListView), const Offset(0, -500), 1000);
```

### Testing Permissions

```typescript
// Detox - iOS
await device.setPermissions({ camera: 'YES', photos: 'YES', location: 'always' });

// Detox - Android
await device.launchApp({
  permissions: { camera: 'YES', location: 'always' },
});
```

### Testing Deep Links

```typescript
// Detox
await device.openURL({ url: 'myapp://product/123' });
await expect(element(by.id('product-screen'))).toBeVisible();

// Appium
await driver.execute('mobile: deepLink', {
  url: 'myapp://product/123',
  package: 'com.example.myapp',
});
```

### Testing Push Notifications

```typescript
// Detox (iOS)
await device.sendUserNotification({
  trigger: { type: 'push' },
  title: 'New Message',
  body: 'You have a new message',
  payload: { type: 'message', id: '123' },
});

// Verify handling
await expect(element(by.id('message-screen'))).toBeVisible();
```

### Testing Offline Mode

```typescript
// Detox
await device.setStatusBar({ networkMode: 'offline' });
await expect(element(by.id('offline-banner'))).toBeVisible();

// Restore
await device.setStatusBar({ networkMode: 'active' });
```

---

## Best Practices

1. **Use Accessibility IDs** - `testID` (RN), `Key` (Flutter), `accessibilityIdentifier` (iOS)
2. **Test real devices in CI** - Use device farms (Firebase Test Lab, AWS Device Farm)
3. **Test on multiple OS versions** - Cover minimum and latest supported versions
4. **Handle platform differences** - Use platform-specific test branches when needed
5. **Test gestures explicitly** - Don't assume gesture recognition works
6. **Mock location/sensors** - Don't rely on real device sensors in tests
7. **Test push notifications** - Critical for engagement features
8. **Test deep links** - Verify all app entry points work
