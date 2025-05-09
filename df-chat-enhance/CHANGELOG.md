# DF Chat Enhancements

## Release 5.1.0 (2025-04-24)
- **UPDATE:** Korean Localization: Courtesy of [Jihoon9836](https://github.com/Jihoon9836)
- **NEW #457:** New keyboard shortcut registered for a Roll Mode Quick Toggle which allows you to quickly switch between two configurable roll modes.
- **NEW #451:** Added setting for collapsing the Adventure Log context menu options into a single option. When clicked, it will launch a dialog with the full option list. This is to help declutter the chat message context menu when using a system that adds a lot of other options.
- **FIX #461:** Editing a message would reveal all of the token names to players. Now players will only see tokens that they own in the list.

## Release 5.0.2 (2025-03-12)
- **FIX #513:** UserConfig properly saves its data again.
- **FIX #512:** Inline-Rolls containing markdown characters in chat function correctly again without being converted to html.

## Release 5.0.1 (2025-03-01)
- **UPDATE #468:** Update Chinese Localization: Courtesy of [LiyuNodream](https://github.com/LiyuNodream).

## Release 5.0.0 (2025-02-28)
- **UPDATE:** Migrated to v12.
- **UPDATE:** Downgraded TS -> JS (such sad).
- **FIX:** Several discovered bugs and problems which have accumulated over time.
- **FIX #417:** Deleting messages after date-range archive now ONLY deletes the selected messages.
- **FIX #408:** Keybindings no longer have defaults.
- **FIX #387:** Adjusted flag setting in Chat Time to use `mergeObject`.
- **FIX #415:** Public Roll icon changed from D20 icon to a more appropriate "public" icon.

## Release 4.1.0 (2022-10-23)
- **UPDATE:** Migrated to V10.

## Release 4.0.1 (2022-06-22)
- **FIX:** Fixed a conflict with Z's Requestor module.

## Release 4.0.0 (2022-06-01)
- **NEW #371:** **More Efficient Chat History!** There is now a customizable Max History in the Chat Log. As messages are added to the log, old messages will automatically be removed from the visible Chat Log. If you scroll back up, the old messages will be re-added as needed, but then scrolling back down will automatically remove them again. This will hopefully help improve FoundryVTT's overall performance during a long session with hundreds of chat messages.
- **NEW #295:** Send message button has been added to the chat box. This can be enabled in the module settings.
- **NEW #316:** Registered editable keybindings for switching roll modes.
- **NEW #241:** Setting for disabling the "(edited)" label from being added to edited messages.
- **NEW #321:** Adventure Log events and quotes can now contain Markdown like any other message.
- **NEW #277:** Added slider for selecting the font size of chat messages. Default size is 14px, but can now be anything from 10px to 30px.
- **NEW #210:** You can now change the speaker for a message when editing it. Lists all available tokens from the current scene in addition to any player.
- **NEW #320:** Players can now be configured their own personal Adventure Log. This is done in the User Config, and players can add entries to their personal log using the new `/plog` command.
- **NEW #342:** Added option to disable the text formatting for Adventure Log entries.
- **NEW #343:** Added option to disable printing the author on Adventure Log entries.
- **NEW #237:** Chat Messages can now show Game Time instead of RealWorld Time using the SimpleCalendar module's API.
- **NEW #346:** Added a drop-down menu that lets you decide which messages should have tinted borders: All, Mine, None.
- **FIX #299:** Fixed chat borders to colour every message not just your own as is the default Foundry behaviour.
- **UPDATE #356:** Whispers in chat archives will now only be visible to GMs, the sender, and the receivers. All others will not see the whispers when viewing the archive.

## Release 3.6.1 (2022-05-30)
- **FIX #231:** Conflict with the combat round messages posted by Monk's Little Details.
- **FIX #370:** Chat Archive will now handle special characters in archive names.
- **FIX #362:** Chat Archives containing unicode characters can now be properly downloaded as HTML.
- **FIX #207:** Scroll to bottom element would not go away if the entire chat log were deleted.
- **FIX #308:** Modules like Dice So Nice! can now safely call ChatLog.scrollBottom and the scroll manager will handle it correctly.
- **FIX #317:** Chat Merging conflict with Midi QOL's roll merging feature.

## Release 3.6.0 (2022-01-02)
- **UPDATE:** Migrated to FoundryVTT V9.
- **UPDATE #274:** Japanese Localization: Courtesy of tonishi and [BrotherSharper](https://github.com/BrotherSharper).
- **FIX #269:** Public Roll button now displays correctly.
- **FIX #261&#243:** Keyboard entry in chat-box working correctly now.

## Release 3.5.2 (2021-11-22)
- **FIX #219:** Markdown now works as expected with appropriate Chat Commands.
- **FIX #220:** Chat borders are no longer coloured non-owned messages.
- **FIX:** Hover shadow was not working.

## Release 3.5.1 (2021-11-16)
- **FIX #215:** Last character of chat messages was getting accidentally eaten.

## Release 3.5.0 (2021-11-15)
- **NEW:** MarkDown features in the Chat Message box.
- **NEW:** MarkDown features in the Edit Chat Message.
- **FIX:** Chat Edit feature was failing after the first edit if "No HTML" option was on.
- **UPDATE:** Changed the "Edit Last Message" feature shortcut from `Shift+Up` to `Ctrl+Up`.

## Release 3.4.1 (2021-11-09)
- **FIX #203:** Custom Chat Colour crash due to unset flag.

## Release 3.4.0 (2021-11-09)
- **NEW #102:** Chat Color: You can now specify a custom colour for Chat Messages in the User Configuration. This is great for adjusting the tint slightly if the regular colour does not show up well.
- **NEW #102:** Chat Message Background: You can now tint the backgrounds of chat messages. This works the same as the feature in Chat Portraits and does not conflict, but will use the new custom chat colour if available.
- **NEW #66:** Adventure Logs: Can now use the timestamp generated by [SimpleCalendar](https://github.com/vigoren/foundryvtt-simple-calendar).
- **NEW #66:** Adventure Logs: Option to exclude the time from the log entries and used just the date.
- **NEW #198:** Chat Archive Manager can now be sorted.
- **NEW #175:** Chat Archive Message List can now be downloaded as raw HTML, along with CSS classes and inline-styles still in place. This can allow someone to style them however they wish for easy viewing outside of the FoundryVTT program.
- **NEW #185:** Chat Merge now merges messages in the Archive Viewer and in the Popout Chat Log.
- **FIX #189:** Chat Merge was causing some errors on a rare occasions when large numbers of chats are deleted.
- **FIX #202:** Chat Archive visibility not changing.
- **FIX #180:** Roll Type conflict resolved: Courtesy of [zeteticl](https://github.com/zeteticl).
- Japanese Localization: Courtesy of [BrotherSharper](https://github.com/BrotherSharper).
- Korean Localization: Courtesy of [drdwing](https://github.com/drdwing).

## Release 3.3.0 (2021-08-26)
- Korean Localization: Courtesy of [drdwing](https://github.com/drdwing).
- Updated supported Foundry version to 0.8.9.
- Added #132: You can now select the directory for storing Chat Archives.
- Added #167: Merged messages will now default group by Speaker instead of by User. This can be toggled off in the module settings.
- Added #160: Whispers with many recipients will now truncate and display a "(+4 more)" label. Hovering the visible names will show the hidden ones.
- Added #163: Text selection of "formatted" chat messages.
- Updated: The Chat Edit feature has been moved. Instead of an Edit button on each message, this has been moved to the Chat Message Context Menu which can be reached by right-clicking a chat message. This helps to declutter messages in the log.
- Fixed #177: Could not create archive if the chat-archive folder was not already created.
- Fixed #158: Chat Merging will now hide the Chat Portraits for all but the first message in each group.
- Fixed: Chat Portrait CSS conflicted with Chat Merge's header adjustments and made delete button misaligned.

## Release 3.2.0 (2021-06-29)
- Chat Edit: Added option to ignore messages containing HTML from being editable. This will be on by default, but can be turned off to allow editing those messages.
- Chat Merge: Added whole new Chat Merging feature. This will merge chats in the chat log that were sent by the same person within a short period of time.
- Better Scrolling: Added new feature to provide better chat log scrolling. Including a new button for quickly scrolling to bottom, and preventing the auto-scroll from happening when messages are posted. So you can continue searching for that message from an hour ago without getting interrupted by a player doing a roll.

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