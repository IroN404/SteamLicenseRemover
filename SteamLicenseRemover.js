    // ==UserScript==
    // @name         Steam License Remover
    // @namespace
    // @version      2.0
    // @description  Remove any "Free" games from your Steam Library by removing the game's license from your account.  
    // @author       IroN404
    // @fork_comission  Beardox
    // @match        https://store.steampowered.com/account/licenses/


let removedCount = 0;

async function removeGame(id) {
    console.log(`Removing game with ID ${id}...`);
    try {
        const response = await fetch('https://store.steampowered.com/account/removelicense', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `sessionid=${encodeURIComponent(g_sessionID)}&packageid=${encodeURIComponent(id)}`
        });

        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.success === 84) {
            console.log(`Rate limit exceeded. Retrying after delay...`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds
            await removeGame(id);
        } else if (data.success) {
            removedCount++;
            console.log(`Game with ID ${id} removed successfully. Total games removed: ${removedCount}`);
        } else {
            console.log(`Failed to remove game with ID ${id}.`);
        }
    } catch (error) {
        console.error(`Network or parsing error: ${error}`);
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds on network error
        await removeGame(id);
    }
}

function extractIdFromLink(link) {
    const match = link.match(/RemoveFreeLicense\(\s*(\d+)\s*,/);
    return match ? match[1] : null;
}

function countRemovableGames() {
    const removeLinks = document.querySelectorAll('a[href^="javascript:RemoveFreeLicense"]');
    const totalGames = removeLinks.length;
    console.log(`Total removable games: ${totalGames}`);
    return totalGames;
}

async function removeGames() {
    const totalGames = countRemovableGames();
    const intervalID = setInterval(() => {
        console.log(`Games removed: ${removedCount} of ${totalGames}`);
        if (removedCount >= totalGames) {
            clearInterval(intervalID);
        }
    }, 1000);

    const removeLinks = document.querySelectorAll('a[href^="javascript:RemoveFreeLicense"]');
    for (const link of removeLinks) {
        const id = extractIdFromLink(link.href);
        if (id) {
            await removeGame(id);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log(`Failed to extract ID from link: ${link.href}`);
        }
    }

    console.log(`All games removed. Total games removed: ${removedCount}`);
}

removeGames();
