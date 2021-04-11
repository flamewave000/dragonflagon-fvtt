# DragonFlagon Chat Enhancements

Multiple improvements to the chat system feature set. Brings a new Chat Archive that lets you save your current chat log to an archive and keep the chat clean between sessions. Gives an option to replace the Roll Type dropdown menu with a set of 4 buttons. This makes switching rolls much more efficient and provides a better visual indicator for what roll you're in.

- [Adventure Log](#Adventure-Log)
	- [Config](#Config)
	- [Log Command Help](#Log-Command-Help)
	- [Log Commands](#Log-Commands)
	  - [GM Only Log](#GM-Only-Log)
	  - [Right-Click Add to Log](#Right-Click-Add-to-Log)
	  - [Quote Sources](#Quote-Sources)
- [Roll Selector Buttons](#roll-selector-buttons)
- [Chat Archive](#Chat-Archive)
	- [Create Archive](#Create-Archive)
		- [Create Chat Archive Window](#Create-Chat-Archive-Window)
	- [Manage Chat Archives](#Manage-Chat-Archives)
		- [Edit Archive Name](#Edit-Archive-Name)
		- [Delete Messages](#Delete-Messages)
		- [Archive Merging](#Archive-Merging)
- [Edit Sent Messages](#Edit-Sent-Messages)
	- [Edit Last Message Keyboard Shortcut](#Edit-Last-Message-Keyboard-Shortcut)

##### [![become a patron](../.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on. I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!

## Adventure Log

You can now enable the Adventure Log feature for easy in-game event tracking. This feature adds the new chat command `/log` that allows you to quickly add a note about something that has just happened. This command will save the event message as an entry in a designated journal. It will be formatted with a timestamp, and who made the entry.

### Config

Access the config through the settings, or by entering `/log config` into the chat window. This is where you can set the target Journal for Adventure Log entries. It also gives you an option to erase the contents of the Journal. Either way, it will add a new section with a header label "Adventure Log" and will contain the logged entries.

**It is NOT recommended for you to change anything in the section between the header and the horizontal line that denotes the end of the log**

![](../.assets/df-chat-enhance-log-config.png) ![](../.assets/df-chat-enhance-log-config-select.png)

### Log Command Help

At any time you can simply enter `/log` into the chat to display the help dialog

### Log Commands

| Name | Command | Description |
| --- | --- | --- |
| General Event | `/log ...message`<br />`/log e ...message`<br />`/log event ...message` | Logs a simple event message to the adventure log. |
| Quote | `/log q <source> ...message`<br />`/log quote <source> ...message`<br />`/log q "<source with spaces" ...message`<br />`/log quote "<source with spaces" ...message` | Adds an entry Quote of the "Source". |

#### GM Only Log

For any of the above commands, you can use `/gmlog` instead and the event/quote will be sent to the GM Only Adventure Log instead.

![](../.assets/df-chat-enhance-log-entries.png)
![](../.assets/df-chat-enhance-gmlog-entries.png)
![](../.assets/df-chat-enhance-log-messages.png) ![](../.assets/df-chat-enhance-log-add-from-chat.png)

#### Right-Click Add to Log

You can right-click chat messages to add their contents as an Event or as a Quote. When adding as a quote, it will use the original message's sender as the [Quote Source](#Quote-Sources)

#### Quote Sources

You do not need to add quotes around the Source Name, unless there are spaces in the name. Such as the following:
`/log q Bobby McFerrin Don't worry, be happy!`
Will output into the log

> [2021-02-12 4:35PM] (Susan) Bobby said: "McFerrin Don't worry, be happy!"

Instead if you add quotes around the name, it will allow the spaces.
`/log q "Bobby McFerrin" Don't worry, be happy!`
Will output into the log

> [2021-02-12 4:35PM] (Susan) Bobby McFerrin said: "Don't worry, be happy!"

### Macro API

You can post messages to the Adventure Logs using a custom Macro. To do so, simply use the following:

```JavaScript
// Log an Event to the Adventure Log
AdventureLog.event("Something happened!")
// (GM Only) Log an Event to the GM Adventure Log
AdventureLog.gmevent("The players did something!")
// Log a Quote to the Adventure Log
AdventureLog.quote("Bob", "Don't worry, be happy!")
// (GM Only) Log a Quote to the GM Adventure Log
AdventureLog.gmquote("Bob", "Don't worry, be happy!")

// If you want the event/quote posted to the chat, add "true" to the call
AdventureLog.event("Something happened!", true)
AdventureLog.quote("Bob", "Don't worry, be happy!", true)

// (GM Only) GM logs will be whispered to yourself
AdventureLog.gmevent("The players did something!", true)
AdventureLog.gmquote("Bob", "Don't worry, be happy!", true)
```

## Roll Selector Buttons ![Roll Types](../.assets/df-chat-enhance-privacy-roll-types.png)

| Players | Game Masters |
| :-: | :-: |
| ![Roll buttons for players](../.assets/df-chat-enhance-privacy-pc.png) | ![Roll buttons for Game Master](../.assets/df-chat-enhance-privacy-gm.png) |

| Roll Type | Button |
| - | - |
| Public Rolls | ![](../.assets/df-chat-enhance-privacy-rt-public.png) |
| Private GM Rolls | ![](../.assets/df-chat-enhance-privacy-rt-gm.png) |
| Blind GM Rolls | ![](../.assets/df-chat-enhance-privacy-rt-blind.png) |
| Self Rolls | ![](../.assets/df-chat-enhance-privacy-rt-self.png) |

## Chat Archive

The chat archive is a large component of this module. It allows you to save either all of your current messages, or a selected date range of messages. When you save the messages, you can choose to have them automatically deleted from the chat log. Once you have an archive, you can go to the settings tab and click the new "Manage Chat Archive" button to see your archives. Simply click any archive and it will open a viewer window where you can see the old chats!

### Create Archive

To create an archive, simply click the new "Archive chat log" button that is now beside the "save" and "delete" buttons in the chat sidebar. ![archive button](../.assets/df-chat-enhance-archive-new.png)

#### Create Chat Archive Window

|All chats|Date range of chats|
|:-:|:-:|
|![Create chat archive window](../.assets/df-chat-enhance-archive-new-window.png)|![Create chat archive window](../.assets/df-chat-enhance-archive-new-window-date.png)|

The windows is fairly self explanatory, you can select all the current chat messages for archiving, or you can select a local date range.

### Manage Chat Archives

You can view and delete archives from the archive manager. You'll find the ![manage chat archive](../.assets/df-chat-enhance-archive-manage-button.png) button in the sidebar settings tab. You can also see which ones are visible to your players

#### Edit Archive Name

GMs will see a simple Pencil icon next to the Archive's name. Clicking this will open the name editing dialog.

#### Delete Messages

GMs will see the typical Trash Can button on archived messages that allows them to delete them individually.

#### Archive Merging

When viewing a Chat Archive, GMs will see a Merge button in the top right corner. This button presents a Dialog where you can select one of your other archives which can be merged into the one currently being viewed. It also gives a checkbox that if checked will delete the other archive that is being merged into the currently viewed one.

|Manage Archives|View Archive|Edit Archive Name|Archive Merge|
|:-:|:-:|:-:|:-:|
|![Manage archives](../.assets/df-chat-enhance-archive-manage.png)|![View archive](../.assets/df-chat-enhance-archive-viewer.png)|![Edit archive](../.assets/df-chat-enhance-archive-edit.png)|![Merge archive](../.assets/df-chat-enhance-archive-merge.png)|

## Edit Sent Messages

You will now see a little edit button in the top right of messages you are allowed to edit. Clicking this will display a dialog that lets you change the contents of the message. It will also add the "(edited)" flavour to the message to show that it has been modified.

### Edit Last Message Keyboard Shortcut

A keyboard shortcut has now been added to allow you to quickly edit your most recent message you sent. While in the chat box, simply press `[Shift]+[Up]` on the keyboard. An edit message dialog will immediately appear for the most recent message you sent.

![](../.assets/df-chat-enhance-edit-message.png)

