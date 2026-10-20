import Foundation
internal import ExpoModulesCore

class SemliAlarms: Module {
  func definition() -> ModuleDefinition {
    Name("SemliAlarms")
    AsyncFunction("getStatusAsync") { () async -> String in
      if #available(iOS 26.0, *) { return await AlarmEngine.shared.status() }
      return "unsupported"
    }
    AsyncFunction("requestAuthorizationAsync") { () async throws -> String in
      if #available(iOS 26.0, *) { return try await AlarmEngine.shared.authorize() }
      return "unsupported"
    }
    AsyncFunction("syncAsync") { (json: String) async throws -> [String] in
      guard #available(iOS 26.0, *) else { return [] }
      let requests = try JSONDecoder().decode([SemliAlarmRequest].self, from: Data(json.utf8))
      return try await AlarmEngine.shared.synchronize(requests)
    }
  }
}
