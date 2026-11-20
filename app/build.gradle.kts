import com.google.gms.googleservices.GoogleServicesPlugin.MissingGoogleServicesStrategy

plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.compose)
  alias(libs.plugins.google.devtools.ksp)
  alias(libs.plugins.secrets)
  alias(libs.plugins.google.services)
}

android {
  namespace = "com.example"
  compileSdk { version = release(36) { minorApiLevel = 1 } }

  defaultConfig {
    applicationId = "com.imoogle.gambleaware"
    minSdk = 24
    targetSdk = 36
    versionCode = 4
    versionName = "2.1.1"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
  }

  // Read signing variables safely from environment variables or Gradle properties.
  // Blank values are treated as missing so CI/CD builds without secrets never crash.
  fun readBuildVar(name: String): String? =
    providers.environmentVariable(name).orNull?.takeIf { it.isNotBlank() }
      ?: (findProperty(name) as? String)?.takeIf { it.isNotBlank() }

  val releaseKeystorePath = readBuildVar("KEYSTORE_PATH") ?: "${rootDir}/my-upload-key.jks"
  val releaseKeystoreFile = file(releaseKeystorePath)
  val releaseStorePassword = readBuildVar("STORE_PASSWORD")
  val releaseKeyPassword = readBuildVar("KEY_PASSWORD")
  val releaseKeyAlias = readBuildVar("KEY_ALIAS") ?: "upload"
  val hasReleaseSigning =
    releaseKeystoreFile.exists() &&
      releaseStorePassword != null &&
      releaseKeyPassword != null

  val customDebugKeystoreFile = file("${rootDir}/debug.keystore")
  val hasCustomDebugKeystore = customDebugKeystoreFile.exists()

  // Signing configs stay defined for AI Studio & CI builds while guarding against
  // missing environment variables or keystore files on local/forked builds.
  signingConfigs {
    create("release") {
      if (hasReleaseSigning) {
        storeFile = releaseKeystoreFile
        storePassword = releaseStorePassword
        keyAlias = releaseKeyAlias
        keyPassword = releaseKeyPassword
      }
      enableV1Signing = true
      enableV2Signing = true
    }
    create("debugConfig") {
      if (hasCustomDebugKeystore) {
        storeFile = customDebugKeystoreFile
        storePassword = readBuildVar("DEBUG_STORE_PASSWORD") ?: "android"
        keyAlias = readBuildVar("DEBUG_KEY_ALIAS") ?: "androiddebugkey"
        keyPassword = readBuildVar("DEBUG_KEY_PASSWORD") ?: "android"
      }
      enableV1Signing = true
      enableV2Signing = true
    }
  }

  buildTypes {
    release {
      isCrunchPngs = false
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      signingConfig = when {
        hasReleaseSigning -> signingConfigs.getByName("release")
        hasCustomDebugKeystore -> signingConfigs.getByName("debugConfig")
        else -> signingConfigs.getByName("debug")
      }
    }
    debug {
      signingConfig = if (hasCustomDebugKeystore) {
        signingConfigs.getByName("debugConfig")
      } else {
        signingConfigs.getByName("debug")
      }
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }
  buildFeatures {
    compose = true
    buildConfig = true
  }
  testOptions { unitTests { isIncludeAndroidResources = true } }
  dependenciesInfo {
    includeInApk = false
    includeInBundle = true
  }
}

// Configure the Secrets Gradle Plugin to use .env and .env.example files
// to match the convention used in Web projects.
secrets {
  propertiesFileName = ".env"
  defaultPropertiesFileName = ".env.example"
  ignoreList.add("FIREBASE_APPCHECK_DEBUG_TOKEN")
  ignoreList.add("RESEND_API_KEY")
  ignoreList.add("WELCOME_EMAIL_FROM")
  ignoreList.add("GEMINI_API_KEY")
  ignoreList.add("PORT")
  ignoreList.add("NODE_ENV")
}

googleServices { missingGoogleServicesStrategy = MissingGoogleServicesStrategy.WARN }

// Some unused dependencies are commented out below instead of being removed.
// This makes it easy to add them back in the future if needed.
dependencies {
  implementation(platform(libs.androidx.compose.bom))
  // implementation(platform(libs.firebase.bom))
  // implementation(libs.accompanist.permissions)
  implementation(libs.androidx.activity.compose)
  // implementation(libs.androidx.camera.camera2)
  // implementation(libs.androidx.camera.core)
  // implementation(libs.androidx.camera.lifecycle)
  // implementation(libs.androidx.camera.view)
  implementation(libs.androidx.compose.material.icons.core)
  implementation(libs.androidx.compose.material.icons.extended)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.ui.graphics)
  implementation(libs.androidx.compose.ui.tooling.preview)
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.datastore.preferences)
  implementation(libs.androidx.lifecycle.runtime.compose)
  implementation(libs.androidx.lifecycle.runtime.ktx)
  implementation(libs.androidx.lifecycle.viewmodel.compose)
  implementation(libs.androidx.navigation.compose)
  implementation(libs.androidx.room.ktx)
  implementation(libs.androidx.room.runtime)
  // implementation(libs.coil.compose)
  // implementation(libs.converter.moshi)
  // implementation(libs.firebase.ai)
  // Uncomment to use Firestore:
  // implementation(libs.firebase.firestore)

  // Uncomment ALL FOUR of the following dependencies together to use Firebase Auth and Google
  // Sign-In via Credential Manager:
  // implementation(libs.firebase.auth)
  // implementation(libs.androidx.credentials)
  // implementation(libs.androidx.credentials.play.services)
  // implementation(libs.googleid)
  // implementation(libs.firebase.appcheck.recaptcha)
  // implementation(libs.firebase.appcheck.debug)
  implementation(libs.kotlinx.coroutines.android)
  implementation(libs.kotlinx.coroutines.core)
  // implementation(libs.logging.interceptor)
  // implementation(libs.moshi.kotlin)
  // implementation(libs.okhttp)
  // implementation(libs.play.services.location)
  // implementation(libs.retrofit)
  testImplementation(libs.androidx.compose.ui.test.junit4)
  testImplementation(libs.androidx.core)
  testImplementation(libs.androidx.junit)
  testImplementation(libs.junit)
  testImplementation(libs.kotlinx.coroutines.test)
  testImplementation(libs.robolectric)
  androidTestImplementation(platform(libs.androidx.compose.bom))
  androidTestImplementation(libs.androidx.compose.ui.test.junit4)
  androidTestImplementation(libs.androidx.espresso.core)
  androidTestImplementation(libs.androidx.junit)
  androidTestImplementation(libs.androidx.runner)
  debugImplementation(libs.androidx.compose.ui.test.manifest)
  debugImplementation(libs.androidx.compose.ui.tooling)
  "ksp"(libs.androidx.room.compiler)
  // "ksp"(libs.moshi.kotlin.codegen)
}
