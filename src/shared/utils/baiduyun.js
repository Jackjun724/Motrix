import {ipcRenderer} from 'electron'

export async function getFilePath(subUrl, code) {
  const verify = JSON.parse(await (await fetch(`https://pan.baidu.com/share/verify?surl=${subUrl}&channel=chunlei&web=1&app_id=250528&clienttype=0&pwd=${code}`, {
    method: "POST",
    body: `pwd=${code}&vcode=&vcode_str=`,
    mode: 'no-cors',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
  })).text())

  if (verify.errno === 0) {
    const randsk = verify.randsk
    ipcRenderer.send('command', 'session:set-cookie', 'https://pan.baidu.com', 'BDCLND', randsk)
    if (randsk !== 1) {
      const file = await (await fetch(`https://pan.baidu.com/share/list?clienttype=5&showempty=0&page=1&num=100&shorturl=${subUrl}&root=1`, {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
      })).text()

      let a = JSON.parse(file);
      a['randsk'] = randsk;
      return a;
    }
  }

  return {
    code: 1,
    msg: '提取码失败或文件不存在！'
  }
}

export async function getDir(subUrl, randsk, path) {
  ipcRenderer.send('command', 'session:set-cookie', 'https://pan.baidu.com', 'BDCLND', randsk)
  const file = await (await fetch(`https://pan.baidu.com/share/list?clienttype=5&showempty=0&page=1&num=100&shorturl=${subUrl}&dir=${encodeURIComponent(path)}`, {
    method: 'POST',
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

export async function getDownloadUrl({ share_id, uk, path, pwd, codeStr, code}) {

  try {
    return JSON.parse(await (await fetch(`http://api.disk.retzero.com/api/download/link?shareId=${share_id}&uk=${uk}&path=${encodeURIComponent(path)}&pwd=${pwd}&codeStr=${codeStr}&code=${code}`, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit',
    })).text())
  } catch (e) {
  }
}
