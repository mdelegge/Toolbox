# Title: DNDTools
A D&D Fifth Edition (5E) Loot Generator.

## Purpose: 
	Support a list of random tables and loot generators, each generates contents of a fantasy loot event in-game, but each specialized to a theme or purpose (ex: Sailor, Goblin, Magic Shop, Commoners Pockets, Lost Backpack contents, etc.). 

## Design Goals:
	- web interface, javascript, tailwind.css
	- modern look, responsive design.
	- Top level: Display a selectable list of possible generation Modules.
	- User selects a module, module interface is shown. User can then generate a random result from a table of items supported by this module.
	- Table data for list items stored as JSON files.
	- I want to be able to quickly generate lists and create a new module
	- Follow DRY principles. Don't duplicate code if possible.
	- I want to be able to add other types of modules later, like a random dungeon generator.

## Method:
	- generates beween 0 and selectable or default maximum number of items.
	- common items are in the middle of the bell curve distribution of the list.
	- the contents should be pulled from a JSON list of potential items
		- each item might have an attribute that indicates that it is common, uncommon, rare, very rare, or unique.
		- each item might have an attribute that indicates an additional dice roll should be executed to determine the amount of that item found, for example: "Silver pieces (1D12)" would indicate that a random value between 1 and 12 should be generated and displayed, to show how many were found of that item. 
		- the quilifier should determine how frequently it shows up as a result.
