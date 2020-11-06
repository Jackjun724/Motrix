import {ipcRenderer} from 'electron'

export async function getFilePath(subUrl, code) {
  const verify = JSON.parse(await (await fetch(`https://pan.baidu.com/share/verify?surl=${subUrl}&channel=chunlei&web=1&app_id=250528&clienttype=0&pwd=${code}`, {
    method: "POST",
    body: `pwd=${code}&vcode=&vcode_str=`,
    mode: 'no-cors',
    credentials: 'omit',
    headers: {
      'User-Agent': 'netdisk',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': ''
    },
  })).text())

  if (verify.errno === 0) {
    const randsk = verify.randsk
    ipcRenderer.send('command', 'session:set-cookie', 'https://pan.baidu.com', 'BDCLND', randsk)
    if (randsk !== 1) {
      const file = await (await fetch(`https://pan.baidu.com/s/1${subUrl}`, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include',
        headers: {
          'User-Agent': 'netdisk',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
      })).text()

      let json = file.match(/yunData.setData\((\{.*?\})\);/)[1]
      json = JSON.parse(json)
      json['randsk'] = randsk
      return json;
    }
  }

  return {
    code: 1,
    msg: '提取码失败或文件不存在！'
  }
}

export async function getDir(shareId, uk, path) {
  const file = await (await fetch(`https://pan.baidu.com/share/list?uk=${uk}&shareid=${shareId}&order=other&desc=1&showempty=0&web=1&page=1&num=100&dir=${encodeURIComponent(path)}&channel=chunlei&web=1&app_id=250528&clienttype=0`, {
    method: 'GET',
    mode: 'no-cors',
    credentials: 'include',
  })).text()

  let json = JSON.parse(file);
  if (json.errno !== 0) {
    return {
      code: 1,
      msg: '提取码失败或文件不存在！'
    }
  }
  return json.list;
}

export async function getDownloadUrl({fs_id, timestamp, sign, randsk, share_id, uk}) {
  try {
    return JSON.parse(await (await fetch(`http://api.disk.retzero.com/api/download/link?fsId=${fs_id}&timestamp=${timestamp}&sign=${sign}&randsk=${randsk}&shareId=${share_id}&uk=${uk}`, {
      method: "GET",
      mode: 'no-cors',
      credentials: 'omit'
    })).text())
  } catch (e) {
  }
}
