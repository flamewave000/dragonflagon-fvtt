# DF Chat Enhancements

## Release 3.1.1 (2021-06-27)
- Removed GM Log options from PCs' context menus.
- Removed "Delete All Archives" button from displaying on the Archive Manager for PCs.
- Taiwanese Localization: courtesy of [zeteticl](https://github.com/zeteticl).

## Release 3.1.0 (2021-06-07)
- Migrated to FoundryVTT 0.8.6
- Fixed issue with clicking visibility label of chat archive would toggle the first window if multiple archives are open.

## Release 3.0.2 (2021-04-13)
- Fixed styling conflict with the D&D5E Dark Mode module.
- Fixed Archive Name and Visibility not saving correctly.

## Release 3.0.1 (2021-03-26)
- Hotfix: New data storage solution for Chat Archive had a couple hiccups. Should be fixed now. Thanks to [hmqgg](https://github.com/hmqgg) for making a swift fix for the issue.

## Release 3.0.0 (2021-03-24)
- Converted chat log storage over to using physical files on the server to prevent settings database bloat. The initiali groundwork for this change is courtesy of [hmqgg](https://github.com/hmqgg).
- Chinese Localization: courtesy of [hmqgg](https://github.com/hmqgg).
- Exposed Adventure Log as an API that will allow users to log events via Macros.

## Release 2.1.0 (2021-03-11)
- Added Portuguese (Brazil) localisations courtesy of [Brn086](https://github.com/Brn086) and [Matheus Clemente](https://github.com/mclemente)
- Added sort option to Adventure Log so you can invert the direction of the line items.
- Added the ability to print a chat archive.
- Added cancel button to the Chat Edit window, for a clearer way to back out of an accidental edit.

## Release 2.0.0 (2021-02-20)
- Adventure Log
	- You can now right-click chats to add them as an event/quote to the adventure Log.
	- NEW! `/gmlog` command. You can now configure a GM Only log, separate from the general Adventure Log. This way you can make private note taking directly from the chat log without revealing the events to your players. This was sort of possible before by setting your settings in a certain way, but this is definitely simpler and a nice way to have both options.
- Chat Archive
	- GMs can now set the player visibility of Chat Archives. This will allow players to view chat archives the GM has allowed them to see.
	- GMs can now delete individual messages in Chat Archives.
	- Archive Merging! You can now merge other archives into the one currently being viewed!
- Chat Editing
	- You can now select the text in the "Original Message" area.
	- NEW! Shift-Up keyboard combo to edit your last sent message. Simply press and hold Shift, then press the Up key and release. This keyboard shortcut will immediately display the edit message dialog for the most recent chat message you sent.
- Roll Type Buttons: Adjusted colours to be more pleasing to the eye (Yes this is subjective, but what're you gunna do about it!?). Don't worry, I've also tried to use only Accessible Colours for our colour impaired friends in the community 🙂 Each colour should be visually distinct from each other and be within the AA specifications.

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

## Pre-Release 0.0.2

- Chat roll privacy selector as buttons feature.

## Pre-Release 0.0.1

- Core Chat Archive functionality and features.