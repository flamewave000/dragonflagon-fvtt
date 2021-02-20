# DF Chat Enhancements

## Release 2.0.0 (2021-02-20)
- You can now right-click chats to add them as an event/quote to the adventure Log.
- GMs can now set the player visibility of Chat Archives. This will allow players to view chat archives the GM has allowed them to see.
- For chat editing, you can now select the text in the "Original Message" area.

## Release 1.1.2 (2021-02-19)
- Fixed Chat Commands initialization.

## Release 1.1.1 (2021-02-17)
- Fixed crash when enabling the Adventure Log.
- Added support for Bug Reporter

## Release 1.1.0 (2021-02-16)
- Fixed "No Message" and "Missing Quote" errors. They will now properly preserve the message and give you a chance to fix them.
- Fixed lifecycle issues for detecting if the current user has the `isGM` flag set.
- Added setting for disabling Chat Messages for log entries.
- Added setting to turn all log entry chat messages into whispers if the GM Only setting is also set.
- Now if the GM makes a log entry and their Roll Type is not set to Public, it will make the chat message a whisper.

## Release 1.0.1 (2021-02-15)
- Moved settings from 'init' hook to the 'setup' hook, fixes issue where `gaame.user.isGM` is not yet defined.

## Release 1.0.0 (2021-02-14)
- Added new Chat Editing feature!
- Now that the 4 core features are complete. The module is in full release and I can put some focus into improvements.

## Alpha Release 0.3.0 (2021-02-14)
- Added new Adventure Log command feature!
- Set the archive name field to autofocus when the dialog opens. No more needing to click it first, just open the dialog and start typing!

## Alpha Release 0.2.0 (2021-02-10)
- Added option for hiding the Export Chat Log button.
- Added option to convert the other chat buttons into the same style as the new Roll Type buttons.
- Moved the Manage Chat Archive button into a group so it will not conflict with any other buttons that get added to the Game Settings section of the settings tab.

## Alpha Release 0.1.0 (2021-02-09)
- First Alpha release with the core functionality of Chat Archive and Roll Selector Buttons.
- Missing: French Translations

## PreRelease 0.0.2
- Chat roll privacy selector as buttons feature.

## PreRelease 0.0.1
- Core Chat Archive functionality and features.