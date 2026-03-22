/**
 * @param {string} path 
 * @param {object} data 
 * @returns {Promise<HTMLElement>}
 */
export async function renderTemplate(path, data) {
	/**@type {string}*/
	const html = await foundry.applications.handlebars.renderTemplate(path, data);
	return parseHTML(html.trim());
}

/**
 * @param {string} html
 * @returns {HTMLElement}
 */
export function parseHTML(html) {
	const container = document.createElement("div");
	container.innerHTML = html;
	const element = container.firstChild;
	container.removeChild(element);
	return element;
}

/* BELOW ARE TYPE DEFINITIONS FOUND IN foundry.mjs */

/**
 * @typedef ApplicationConfiguration
 * @property {string} id                        An HTML element identifier used for this Application instance
 * @property {string} uniqueId                  An string discriminator substituted for {id} in the default
 *                                              HTML element identifier for the class
 * @property {string[]} classes                 An array of CSS classes to apply to the Application
 * @property {string} tag                       The HTMLElement tag type used for the outer Application frame
 * @property {ApplicationWindowConfiguration} window  Configuration of the window behaviors for this Application
 * @property {Record<string, ApplicationClickAction|{handler: ApplicationClickAction, buttons: number[]}>} actions
 *                                              Click actions supported by the Application and their event handler
 *                                              functions. A handler function can be defined directly which only
 *                                              responds to left-click events. Otherwise, an object can be declared
 *                                              containing both a handler function and an array of buttons which are
 *                                              matched against the PointerEvent#button property.
 * @property {ApplicationFormConfiguration} [form] Configuration used if the application top-level element is a form or
 *                                                 dialog
 * @property {Partial<ApplicationPosition>} position  Default positioning data for the application
 */

/**
 * @typedef ApplicationPosition
 * @property {number} top                       Window offset pixels from top
 * @property {number} left                      Window offset pixels from left
 * @property {number|"auto"} width              Un-scaled pixels in width or "auto"
 * @property {number|"auto"} height             Un-scaled pixels in height or "auto"
 * @property {number} scale                     A numeric scaling factor applied to application dimensions
 * @property {number} zIndex                    A z-index of the application relative to siblings
 */

/**
 * @typedef ApplicationWindowConfiguration
 * @property {boolean} [frame=true]             Is this Application rendered inside a window frame?
 * @property {boolean} [positioned=true]        Can this Application be positioned via JavaScript or only by CSS
 * @property {string} [title]                   The window title. Displayed only if the application is framed
 * @property {string|false} [icon]              An optional Font Awesome icon class displayed left of the window title
 * @property {ApplicationHeaderControlsEntry[]} [controls]  An array of window control entries
 * @property {boolean} [minimizable=true]       Can the window app be minimized by double-clicking on the title
 * @property {boolean} [resizable=false]        Is this window resizable?
 * @property {string} [contentTag="section"]    A specific tag name to use for the .window-content element
 * @property {string[]} [contentClasses]        Additional CSS classes to apply to the .window-content element
 */

/**
 * @typedef ApplicationFormConfiguration
 * @property {ApplicationFormSubmission} handler
 * @property {boolean} submitOnChange
 * @property {boolean} closeOnSubmit
 */

/**
 * @typedef ApplicationHeaderControlsEntry
 * @property {string} icon                      A font-awesome icon class which denotes the control button
 * @property {string} label                     The text label for the control button. This label will be automatically
 *                                              localized when the button is rendered
 * @property {string} action                    The action name triggered by clicking the control button
 * @property {boolean|(() => boolean)} [visible] Is the control button visible for the current client?
 * @property {DocumentOwnershipLevel} [ownership] A key or value in {@link CONST.DOCUMENT_OWNERSHIP_LEVELS} that
 *                                                restricts visibility of this option for the current user. This option
 *                                                only applies to DocumentSheetV2 instances.
 * @property {(event: PointerEvent) => void|Promise<void>} [onClick] A custom click handler function. Asynchronous
 *                                                                   functions are not awaited.
 */

/**
 * @typedef ApplicationConstructorParams
 * @property {ApplicationPosition} position
 */

/**
 * @typedef ApplicationRenderOptions
 * @property {boolean} [force=false]            Force application rendering. If true, an application which does not
 *                                              yet exist in the DOM is added. If false, only applications which
 *                                              already exist are rendered.
 * @property {ApplicationPosition} [position]   A specific position at which to render the Application
 * @property {ApplicationWindowRenderOptions} [window]  Updates to the Application window frame
 * @property {string[]} [parts]                 Some Application classes, for example the HandlebarsApplication,
 *                                              support re-rendering a subset of application parts instead of the full
 *                                              Application HTML.
 * @property {boolean} [isFirstRender]          Is this render the first one for the application? This property is
 *                                              populated automatically.
 * @property {Record<string, string>|string} [tab]  A tab to activate. Either the tab's ID for applications with only
 *                                                  one tab group, or an object of tab groups to tab IDs. Re-rendering
 *                                                  an Application with this option will not trigger changeTab.
 */

/**
 * @typedef ApplicationWindowRenderOptions
 * @property {string} title                     Update the window title with a new value?
 * @property {string|false} icon                Update the window icon with a new value?
 * @property {boolean} controls                 Re-render the window controls menu?
 */

/**
 * @typedef ApplicationRenderContext   Context data provided to the renderer
 * @property {Record<string, ApplicationTab>} [tabs]    Tab data prepared from an entry in
 *   {@link foundry.applications.api.ApplicationV2.TABS}
 */

/**
 * @typedef ApplicationClosingOptions
 * @property {boolean} animate                  Whether to animate the close, or perform it instantaneously
 * @property {boolean} closeKey                 Whether the application was closed via keypress.
 * @property {boolean} submitted                Is the application being closed because a form was submitted?
 */

/**
 * @callback ApplicationClickAction             An on-click action supported by the Application. Run in the context of
 *                                              a {@link foundry.applications.api.HandlebarsApplicationMixin}.
 * @param {PointerEvent} event                  The originating click event
 * @param {HTMLElement} target                  The capturing HTML element which defines the [data-action]
 * @returns {void|Promise<void>}
 */

/**
 * @callback ApplicationFormSubmission          A form submission handler method. Run in the context of a
 *                                              {@link foundry.applications.api.HandlebarsApplicationMixin}.
 * @param {SubmitEvent|Event} event             The originating form submission or input change event
 * @param {HTMLFormElement} form                The form element that was submitted
 * @param {FormDataExtended} formData           Processed data for the submitted form
 * @returns {Promise<any>}
 */

/**
 * @typedef ApplicationTabsConfiguration
 * @property {{id: string; icon?: string; label?: string; tooltip?: string, cssClass?: string}[]} tabs
 *                                  An array of tab configuration data
 * @property {string} [initial]     The tab in this group that will be active on first render
 * @property {string} [labelPrefix] A localization path prefix for all tabs in the group: if set, a label is generated
 *                                  for each tab using a full path of `${labelPrefix}.${tabId}`.
 */

/**
 * @typedef {Record<string, HandlebarsTemplatePart>} ApplicationParts
 */

/**
 * @typedef ApplicationTab
 * @property {string}  id
 * @property {string}  group
 * @property {boolean} active
 * @property {string}  cssClass
 * @property {string}  [label]
 * @property {string}  [icon]
 * @property {string}  [tooltip]
 */

/**
 * @typedef FormNode
 * @property {boolean} fieldset
 * @property {string} [legend]
 * @property {FormNode[]} [fields]
 * @property {DataField} [field]
 * @property {any} [value]
 */

/**
 * @typedef FormFooterButton
 * @property {string} type
 * @property {string} [name]
 * @property {string} [icon]
 * @property {string} [label]
 * @property {string} [action]
 * @property {string} [cssClass]
 * @property {boolean} [disabled=false]
 */

/**
 * @typedef HandlebarsRenderOptions
 * @property {string[]} parts                       An array of named template parts to render
 */

/**
 * @typedef HandlebarsTemplatePart
 * @property {string} template                      The template entry-point for the part
 * @property {string} [id]                          A CSS id to assign to the top-level element of the rendered part.
 *                                                  This id string is automatically prefixed by the application id.
 * @property {boolean} [root=false]                 Does this rendered contents of this template part replace the
 *                                                  children of the root element?
 * @property {string[]} [classes]                   An array of CSS classes to apply to the top-level element of the
 *                                                  rendered part.
 * @property {string[]} [templates]                 An array of additional templates that are required to render the
 *                                                  part. If omitted, only the entry-point is inferred as required.
 * @property {string[]} [scrollable]                An array of selectors within this part whose scroll positions should
 *                                                  be persisted during a re-render operation. A blank string is used
 *                                                  to denote that the root level of the part is scrollable.
 * @property {Record<string, ApplicationFormConfiguration>} [forms] A registry of forms selectors and submission
 *                                                                  handlers.
 */