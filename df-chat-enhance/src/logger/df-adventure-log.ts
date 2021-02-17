import CONFIG from "../CONFIG.js";
import DFAdventureLogConfig from "./DFAdventureLogConfig.js";
import DFAdventureLogProcessor from "./DFAdventureLogProcessor.js";


export default function initDFAdventureLog() {

	DFAdventureLogConfig.setupSettings();
	DFAdventureLogProcessor.setupSettings();
}