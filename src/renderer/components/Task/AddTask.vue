<template>
  <el-dialog
    custom-class="tab-title-dialog add-task-dialog"
    width="64vw"
    :visible.sync="visible"
    :before-close="handleClose"
    @open="handleOpen"
    @opened="handleOpened"
    @closed="handleClosed"
    v-loading="dialogLoading"
  >
    <el-form ref="taskForm" label-position="left" :model="form" :rules="rules">
      <el-tabs :value="type" @tab-click="handleTabClick">
        <el-tab-pane :label="$t('task.uri-task')" name="uri">
          <el-form-item>
            <el-input
              ref="uri"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 5 }"
              auto-complete="off"
              :placeholder="$t('task.uri-task-tips')"
              @paste.native="handleUriPaste"
              v-model="form.uris"
            >
            </el-input>
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane :label="$t('task.torrent-task')" name="torrent">
          <el-form-item>
            <mo-select-torrent v-on:change="handleTorrentChange"/>
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane label="百度云下载" name="baidu">
          <el-form-item>
            <el-row :gutter="12">
              <el-col :span="11" :xs="24">
                <el-form-item
                  label="链接: "
                  label-width="50px"
                >
                  <el-input
                    placeholder="百度云链接"
                    v-model="baiduYun.url"
                  >
                  </el-input>
                </el-form-item>
              </el-col>

              <el-col :span="8" :xs="24">
                <el-form-item
                  label="提取码："
                  label-width="70px"
                >
                  <el-input
                    v-model="baiduYun.code"
                    placeholder="提取码"
                  >
                  </el-input>
                </el-form-item>
              </el-col>

              <el-col :span="4">
                <el-button @click="getFile">
                  获取文件
                </el-button>
              </el-col>
              <el-col :span="24">
                <el-table
                  v-loading="tableLoading"
                  :data="baiduYunList"
                  highlight-current-row
                  @current-change="handleCurrentChange"
                  ref="baiduYunTable"
                  style="width: 100%">
                  <el-table-column
                    prop="server_filename"
                    label="名称"
                    show-overflow-tooltip
                    width="220">
                  </el-table-column>
                  <el-table-column
                    prop="size"
                    label="大小"
                    width="100">
                    <template slot-scope="scope">
                      {{scope.row.isdir == 1 ? '-' : renderSize(scope.row.size)}}
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="md5"
                    show-overflow-tooltip
                    label="MD5">
                  </el-table-column>
                </el-table>
              </el-col>
              <template v-if="captchaShow">
                <el-col :span="4" style="padding-top: 20px;">
                  <img
                    :src="captcha.url"
                    @click="refreshCaptcha"
                    alt="">
                </el-col>
                <el-col :span="16" style="margin-top: 20px">
                  <el-form-item
                    label="验证码："
                    label-width="70px"
                  >
                    <el-input
                      v-model="captcha.code"
                      placeholder="验证码"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="4" style="padding-top: 20px;">
                  <el-button @click="handlerPanDownload">
                    继续
                  </el-button>
                </el-col>
              </template>
            </el-row>
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
      <el-row :gutter="12">
        <el-col :span="15" :xs="24">
          <el-form-item
            :label="`${$t('task.task-out')}: `"
            :label-width="formLabelWidth"
          >
            <el-input
              :placeholder="$t('task.task-out-tips')"
              v-model="form.out"
            >
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="9" :xs="24">
          <el-form-item
            :label="`${$t('task.task-split')}: `"
            :label-width="formLabelWidth"
          >
            <el-input-number
              v-model="form.split"
              controls-position="right"
              :min="1"
              :max="config.engineMaxConnectionPerServer"
              :label="$t('task.task-split')"
            >
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item
        :label="`${$t('task.task-dir')}: `"
        :label-width="formLabelWidth"
      >
        <el-input
          placeholder=""
          v-model="form.dir"
          :readonly="isMas"
        >
          <mo-select-directory
            v-if="isRenderer"
            slot="append"
            @selected="onDirectorySelected"
          />
        </el-input>
      </el-form-item>
      <div class="task-advanced-options" v-if="showAdvanced">
        <el-form-item
          :label="`${$t('task.task-user-agent')}: `"
          :label-width="formLabelWidth"
        >
          <el-input
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 3 }"
            auto-complete="off"
            :placeholder="$t('task.task-user-agent')"
            v-model="form.userAgent"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          :label="`${$t('task.task-referer')}: `"
          :label-width="formLabelWidth"
        >
          <el-input
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 3 }"
            auto-complete="off"
            :placeholder="$t('task.task-referer')"
            v-model="form.referer"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          :label="`${$t('task.task-cookie')}: `"
          :label-width="formLabelWidth"
        >
          <el-input
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 3 }"
            auto-complete="off"
            :placeholder="$t('task.task-cookie')"
            v-model="form.cookie"
          >
          </el-input>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="15" :xs="24">
            <el-form-item
              :label="`${$t('task.task-proxy')}: `"
              :label-width="formLabelWidth"
            >
              <el-input
                placeholder="[http://][USER:PASSWORD@]HOST[:PORT]"
                v-model="form.allProxy">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="9" :xs="24">
            <div class="help-link">
              <a target="_blank" href="https://github.com/agalwood/Motrix/wiki/Proxy" rel="noopener noreferrer">
                {{ $t('preferences.proxy-tips') }}
                <mo-icon name="link" width="12" height="12"/>
              </a>
            </div>
          </el-col>
        </el-row>
        <el-form-item label="" :label-width="formLabelWidth" style="margin-top: 12px;">
          <el-checkbox class="chk" v-model="form.newTaskShowDownloading">
            {{$t('task.navigate-to-downloading')}}
          </el-checkbox>
        </el-form-item>
      </div>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-row>
        <el-col :span="9" :xs="9">
          <el-checkbox class="chk" v-model="showAdvanced">
            {{$t('task.show-advanced-options')}}
          </el-checkbox>
        </el-col>
        <el-col :span="15" :xs="15">
          <el-button @click="handleCancel('taskForm')">
            {{$t('app.cancel')}}
          </el-button>
          <el-button
            type="primary"
            @click="submitForm('taskForm')"
            v-if="this.type != baiduType"
          >
            {{$t('app.submit')}}
          </el-button>
        </el-col>
      </el-row>
    </div>
  </el-dialog>
</template>

<script>
  import is from 'electron-is'
  import {mapState} from 'vuex'
  import {isEmpty} from 'lodash'
  import SelectDirectory from '@/components/Native/SelectDirectory'
  import SelectTorrent from '@/components/Task/SelectTorrent'
  import {buildTorrentPayload, buildUriPayload, initTaskForm} from '@/utils/task'
  import {ADD_TASK_TYPE} from '@shared/constants'
  import {detectResource} from '@shared/utils'
  import '@/components/Icons/inbox'
  import {getDir, getDownloadUrl, getFilePath} from '../../../shared/utils/baiduyun'

  export default {
    name: 'mo-add-task',
    components: {
      [SelectDirectory.name]: SelectDirectory,
      [SelectTorrent.name]: SelectTorrent
    },
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        default: ADD_TASK_TYPE.URI
      }
    },
    data() {
      return {
        baiduType: ADD_TASK_TYPE.BAIDU,
        captchaShow: false,
        formLabelWidth: '100px',
        showAdvanced: false,
        form: {},
        rules: {},
        captcha: {
          rawUrl: '',
          key: '',
          url: '',
          code: ''
        },
        baiduYun: {
          surl: '',
          url: '',
          code: ''
        },
        baiduYunList: [],
        currentRow: '',
        tableLoading: false,
        baiduYunData: '',
        dialogLoading: false,
      }
    },
    computed: {
      isRenderer: () => is.renderer(),
      isMas: () => is.mas(),
      ...mapState('app', {
        taskList: state => state.taskList
      }),
      ...mapState('preference', {
        config: state => state.config
      }),
      taskType() {
        return this.type
      }
    },
    watch: {
      taskType(current, previous) {
        if (this.visible && previous === ADD_TASK_TYPE.URI) {
          return
        }

        if (current === ADD_TASK_TYPE.URI) {
          setTimeout(() => {
            this.$refs.uri && this.$refs.uri.focus()
          }, 50)
        }
      },
      visible(current) {
        if (current === true) {
          document.addEventListener('keydown', this.handleHotkey)
        } else {
          document.removeEventListener('keydown', this.handleHotkey)
        }
      }
    },
    methods: {
      renderSize(value) {
        if (null == value || value == '') {
          return "0 Bytes";
        }
        var unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
        var index = 0;
        var srcsize = parseFloat(value);
        index = Math.floor(Math.log(srcsize) / Math.log(1024));
        var size = srcsize / Math.pow(1024, index);
        size = size.toFixed(2);//保留的小数位数
        return size + unitArr[index];
      },
      async handleCurrentChange(val) {
        if (!val) return
        if (parseInt(val["isdir"]) !== 0) {
          this.tableLoading = true
          let res = await getDir(this.baiduYun.surl, this.baiduYunData.randsk, val["path"])
          this.tableLoading = false
          if (res.code === 1) {
            this.$msg({
              type: 'warning',
              message: a.msg,
              duration: 6000
            })
            return;
          }
          this.baiduYunList = res
          this.currentRow = ''
          this.$refs.baiduYunTable.setCurrentRow();
        } else {
          this.currentRow = val;
          this.handlerPanDownload(true);
        }
      },
      refreshCaptcha() {
        this.captcha.url = this.captcha.rawUrl + '&rand=' + parseInt(Math.random() * 100)
      },
      async handlerPanDownload(flag) {
        if (!flag) {
          this.dialogLoading = true
        }
        let val = this.currentRow
        this.tableLoading = true
        let res = await getDownloadUrl({
          share_id: this.baiduYunData.share_id,
          uk: this.baiduYunData.uk,
          path: val.path,
          pwd: this.baiduYun.code,
          codeStr: this.captcha.key,
          code: this.captcha.code
        })
        if (res.code === 0) {
          this.form.uris = res.data.url
          this.form.out = this.currentRow.server_filename
          this.form.userAgent = res.data.ua
          this.submitForm('taskForm')
          this.$msg({
            type: 'success',
            message: '正在下载: ' + this.currentRow.server_filename,
            duration: 6000
          })
          this.tableLoading = false
          this.$refs.baiduYunTable.setCurrentRow();
        } else if (res.code == -10) {
          // 验证码
          this.captcha.url = res.data.captchaUrl;
          this.captcha.rawUrl = res.data.captchaUrl;
          this.captcha.key = res.data.codeStr;
          this.captchaShow = true;
        } else {
          this.$msg({
            type: 'warning',
            message: res.message,
            duration: 6000
          })
          this.tableLoading = false
          this.$refs.baiduYunTable.setCurrentRow();
        }

        if (!flag) {
          this.dialogLoading = false
        }

      },
      async getFile() {
        this.captcha = {
          key: '',
          url: '',
          code: ''
        }

        let link = this.baiduYun.url
        if (link == null || link === "") {
          this.$msg({
            type: 'warning',
            message: '请输入链接',
            duration: 6000
          })
          return;
        }

        let surl = link.match(/surl=([A-Za-z0-9-_]+)/);
        if (surl == null) {
          surl = link.match(/1[A-Za-z0-9-_]+/);
          if (surl == null) {
            this.$msg({
              type: 'warning',
              message: '分享链接填写有误，请检查',
              duration: 6000
            })
          } else {
            surl = surl[0];
          }
        } else {
          surl = "1" + surl[1];
        }
        this.baiduYun.surl = ("" + surl).substring(1)
        this.tableLoading = true
        let a = await getFilePath(this.baiduYun.surl, this.baiduYun.code)
        if (a) {
          this.tableLoading = false
        }
        if (a.code === 1) {
          this.$msg({
            type: 'warning',
            message: a.msg,
            duration: 6000
          })
          return;
        }
        this.baiduYunData = a
        if (a['list'] && a['errno'] === 0) {
          this.baiduYunList = a['list'];
        } else {
          this.$msg({
            type: 'warning',
            message: '获取文件信息失败或链接失效！',
            duration: 6000
          })
        }
      },
      autofillResourceLink() {
        const content = this.$electron.clipboard.readText()
        const hasResource = detectResource(content)
        if (!hasResource) {
          return
        }
        if (isEmpty(this.form.uris)) {
          this.form.uris = content
        }
      },
      handleOpen() {
        this.captchaShow = false
        this.form = initTaskForm(this.$store.state)
        this.baiduYun = {
          surl: '',
          url: '',
          code: ''
        };
        this.baiduYunList = [];
        this.currentRow = '';
        this.tableLoading = false;
        this.baiduYunData = '';
        const content = this.$electron.clipboard.readText()
        if (content.trim().indexOf("https://pan.baidu.com") === 0) {
          this.taskType === ADD_TASK_TYPE.BAIDU;
          this.baiduYun.url = content;
        } else if (this.taskType === ADD_TASK_TYPE.URI) {
          this.autofillResourceLink()
          setTimeout(() => {
            this.$refs.uri && this.$refs.uri.focus()
          }, 50)
        }
      },
      handleOpened() {
        this.detectThunderResource(this.form.uris)
      },
      handleCancel(formName) {
        this.$store.dispatch('app/hideAddTaskDialog')
      },
      handleClose(done) {
        this.$store.dispatch('app/hideAddTaskDialog')
        this.$store.dispatch('app/updateAddTaskOptions', {})
      },
      handleClosed() {
        this.reset()
      },
      handleHotkey(event) {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()

          this.submitForm('taskForm')
        }
      },
      handleTabClick(tab, event) {
        this.$store.dispatch('app/changeAddTaskType', tab.name)
      },
      handleUriPaste() {
        setImmediate(() => {
          const uris = this.$refs.uri.value
          this.detectThunderResource(uris)
        })
      },
      detectThunderResource(uris = '') {
        if (uris.includes('thunder://')) {
          this.$msg({
            type: 'warning',
            message: this.$t('task.thunder-link-tips'),
            duration: 6000
          })
        }
      },
      handleTorrentChange(torrent, selectedFileIndex) {
        this.form.torrent = torrent
        this.form.selectFile = selectedFileIndex
      },
      onDirectorySelected(dir) {
        this.form.dir = dir
      },
      reset() {
        this.captchaShow = false
        this.showAdvanced = false
        this.form = initTaskForm(this.$store.state)
      },
      addTask(type, form) {
        let payload = null
        if (type === ADD_TASK_TYPE.URI) {
          payload = buildUriPayload(form)
          this.$store.dispatch('task/addUri', payload).catch(err => {
            this.$msg.error(err.message)
          })
        } else if (type === ADD_TASK_TYPE.TORRENT) {
          payload = buildTorrentPayload(form)
          this.$store.dispatch('task/addTorrent', payload).catch(err => {
            this.$msg.error(err.message)
          })
        } else if (type === 'metalink') {
          // @TODO addMetalink
        } else {
          console.error('addTask fail', form)
        }
      },
      submitForm(formName) {
        if (this.type === ADD_TASK_TYPE.BAIDU) {
          try {
            this.addTask(ADD_TASK_TYPE.URI, {...this.form})
            this.form = {}
            this.$store.dispatch('app/hideAddTaskDialog')
            if (this.form.newTaskShowDownloading) {
              this.$router.push({
                path: '/task/active'
              }).catch(err => {
                console.log(err)
              })
            }
          } catch (err) {
            this.$msg.error(this.$t(err.message))
          }

          return;
        }
        this.$refs[formName].validate(valid => {
          if (!valid) {
            return false
          }

          try {
            this.addTask(this.type, this.form)

            this.$store.dispatch('app/hideAddTaskDialog')
            if (this.form.newTaskShowDownloading) {
              this.$router.push({
                path: '/task/active'
              }).catch(err => {
                console.log(err)
              })
            }
          } catch (err) {
            this.$msg.error(this.$t(err.message))
          }
        })
      }
    }
  }
</script>

<style lang="scss">
  .el-dialog.add-task-dialog {
    max-width: 632px;
    min-width: 380px;

    .task-advanced-options .el-form-item:last-of-type {
      margin-bottom: 0;
    }

    .el-tabs__header {
      user-select: none;
    }

    .el-input-number.el-input-number--mini {
      width: 100%;
    }

    .help-link {
      font-size: 12px;
      line-height: 14px;
      padding-top: 7px;

      > a {
        color: #909399;
      }
    }

    .el-dialog__footer {
      padding-top: 20px;
      background-color: $--add-task-dialog-footer-background;
      border-radius: 0 0 5px 5px;
    }

    .dialog-footer {
      .chk {
        float: left;
        line-height: 28px;

        &.el-checkbox {
          & .el-checkbox__input {
            line-height: 19px;
          }

          & .el-checkbox__label {
            padding-left: 6px;
          }
        }
      }
    }
  }
</style>
