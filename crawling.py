# lib
import requests
from bs4 import BeautifulSoup
from datetime import datetime,timezone

def getData():
    # code
    dt = datetime.now(timezone.utc).replace(tzinfo=None)
    timeStamp = int(datetime.timestamp(dt))
    resMini = requests.get('https://www.mining-dutch.nl/pools/dogecoin.php?page=api&action=getdashboarddata&api_key=&id=&_={timeStamp}')
    reschain = requests.get('https://dogechain.info/')
    html_content = reschain.text
    soup = BeautifulSoup(html_content, "html.parser")
    profitability = resMini.json()['getdashboarddata']['data']['pool']['price']
    difficulty = int(resMini.json()['getdashboarddata']['data']['network']['difficulty'][0:4])
    current_difficulty = int(soup.find('h3',{'id':'block_difficulty'}).get_text().replace(',','')[0:4])
    responseScreen = 'Sai khối'
    if difficulty != current_difficulty :
        responseScreen = ''
    block = soup.find_all('tr')
    blockinfor =  block[1].find_all('td')
    blockNumber = blockinfor[0].get_text()
    blockTime = str(dt - datetime.strptime(blockinfor[1].find('abbr').get('title'), '%Y-%m-%dT%H:%M:%SZ'))[:7]
    blockTransactions = blockinfor[2].get_text()
    blockReward = blockinfor[3].get_text()
    blockSize = blockinfor[4].get_text()
    dataBlock = [blockNumber, blockTime, blockTransactions,blockReward,blockSize]

    return [profitability,difficulty,current_difficulty,responseScreen, dataBlock]

getData()
