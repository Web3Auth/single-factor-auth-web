<script setup lang="ts">
import { Button, Card, Select, Tab, Tabs, Tag, TextField, Toggle } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, ChainNamespaceType, IBaseProvider, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { LoginParams, Web3Auth } from "@web3auth/single-factor-auth";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import base64url from "base64url";
import { computed, ref, watch } from "vue";

import { chainConfigs, chainNamespaceOptions, clientIds, FormData, networkOptions } from "./config";

const web3Auth = ref<Web3Auth | null>(null);

const formData = ref<FormData>({
  network: WEB3AUTH_NETWORK.TESTNET,
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chain: "",
  clientId: "",
  verifier: "",
  verifierId: "",
  idToken: "",
});

const chainOptions = computed(() =>
  chainConfigs[formData.value.chainNamespace as ChainNamespaceType].map((x) => ({
    name: `${x.chainId} ${x.tickerName}`,
    value: x.chainId,
  }))
);

const loginParams = computed<LoginParams>(() => ({
  verifier: formData.value.verifier,
  verifierId: formData.value.clientId,
  idToken: formData.value.idToken,
}));

const privateKeyProvider = computed<IBaseProvider | null>(() => {
  const chainNamespace = formData.value.chainNamespace as ChainNamespaceType;
  const chainConfig = chainConfigs[chainNamespace].find((x) => x.chainId === formData.value.chain);
  switch (chainNamespace) {
    case CHAIN_NAMESPACES.EIP155:
      return new EthereumPrivateKeyProvider({ config: { chainConfig } });
    case CHAIN_NAMESPACES.SOLANA:
      return new SolanaPrivateKeyProvider({ config: { chainConfig } });
    default:
      return null;
  }
});

const initW3A = async () => {
  if (!chainOptions.value.find((option) => option.value === formData.value.chain)) formData.value.chain = chainOptions.value[0]?.value;
  localStorage.setItem("state", JSON.stringify(formData.value));
  const w3A = new Web3Auth({
    web3AuthNetwork: formData.value.network,
    privateKeyProvider: privateKeyProvider.value,
    clientId: clientIds[formData.value.network],
  });
  await w3A.init();
  web3Auth.value = w3A;
};

// Init the web3Auth object
const init = async () => {
  initW3A();
};
init();

// Every time the form data changes, reinitialize the web3Auth object
watch(formData.value, async () => {
  initW3A();
});

const onDoNothing = () => {};
const onConnect = () => {
  if (web3Auth.value) {
    web3Auth.value.connect(loginParams.value);
  }
};

const isDisplay = (key: string) => {
  switch (key) {
    case "form":
      return true;
    case "btnLogout":
    case "appHeading":
      return true;
    default:
      return false;
  }
};
const isDisabled = (key: string) => {
  switch (key) {
    case "btnConnect":
      return false;
    default:
      return false;
  }
};

const decodeToken = <T,>(token: string): { header: { alg: string; typ: string; kid?: string }; payload: T } => {
  const [header, payload] = token.split(".");
  return {
    header: JSON.parse(base64url.decode(header)),
    payload: JSON.parse(base64url.decode(payload)) as T,
  };
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onCallback = (res: any) => {
  formData.value.idToken = res.credential;
  formData.value.verifier = "google";
  const { payload } = decodeToken<{ email: string }>(res.credential);
  formData.value.clientId = payload.email;
};
</script>

<template>
  <nav class="bg-white sticky top-0 z-50 w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="`/web3auth.svg`" class="h-8" alt="W3A Logo" />
      </a>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <Button v-if="isDisplay('btnLogout')" block size="xs" pill variant="secondary" @click="onDoNothing">
          {{ $t("app.btnLogout") }}
        </Button>
        <Button v-else block size="xs" pill variant="secondary" @click="onDoNothing">
          {{ $t("app.documentation") }}
        </Button>
      </div>
      <div id="navbar-sticky" class="items-center justify-between w-full md:flex md:w-auto md:order-1">
        <div v-if="isDisplay('appHeading')" class="max-sm:w-full">
          <h1 class="leading-tight text-3xl font-extrabold">{{ $t("app.title") }}</h1>
          <p class="leading-tight text-1xl">{{ $t("app.description") }}</p>
        </div>
      </div>
    </div>
  </nav>
  <main class="flex-1 p-1">
    <div class="relative">
      <div v-if="isDisplay('form')" class="grid grid-cols-8 gap-0">
        <div class="col-span-0 sm:col-span-1 lg:col-span-2"></div>
        <Card class="h-auto px-8 py-8 col-span-8 sm:col-span-6 lg:col-span-4">
          <div class="text-3xl font-bold leading-tight text-center">{{ $t("app.greeting") }}</div>

          <Select
            v-model="formData.network"
            data-testid="selectNetwork"
            :label="$t('app.network')"
            :aria-label="$t('app.network')"
            :placeholder="$t('app.network')"
            :options="networkOptions"
          />
          <Select
            v-model="formData.chainNamespace"
            data-testid="selectChainNamespace"
            :label="$t('app.chainNamespace')"
            :aria-label="$t('app.chainNamespace')"
            :placeholder="$t('app.chainNamespace')"
            :options="chainNamespaceOptions"
          />
          <Select
            v-model="formData.chain"
            data-testid="selectChain"
            :label="$t('app.chain')"
            :aria-label="$t('app.chain')"
            :placeholder="$t('app.chain')"
            :options="chainOptions"
          />
          <TextField
            v-model="formData.verifier"
            data-testid="inputVerifier"
            :label="$t('app.verifier')"
            :aria-label="$t('app.verifier')"
            :placeholder="$t('app.verifier')"
          />
          <TextField
            v-model="formData.clientId"
            data-testid="inputVerifierId"
            :label="$t('app.verifierId')"
            :aria-label="$t('app.verifierId')"
            :placeholder="$t('app.verifierId')"
          />
          <TextField
            v-model="formData.idToken"
            data-testid="inputIdToken"
            :label="$t('app.idToken')"
            :aria-label="$t('app.idToken')"
            :placeholder="$t('app.idToken')"
          />
          <div class="flex justify-center mt-5 w-full gap-2">
            <GoogleLogin :callback="onCallback" />
          </div>
          <div class="flex justify-center mt-2 w-full gap-2">
            <Button data-testid="loginButton" type="button" block size="md" :disabled="isDisabled('btnConnect')" @click="onConnect">
              Login with passkey
            </Button>
          </div>
          <div class="text-base text-app-gray-900 dark:text-app-gray-200 font-medium mt-4 mb-5 px-0">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever
            since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only
            five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the
            release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker
            including versions of Lorem Ipsum.
          </div>
        </Card>
      </div>
      <div v-else class="grid gap-0">
        <!-- <div class="grid grid-cols-8 gap-0">
          <div class="col-span-1"></div>
          <Card class="px-4 py-4 gird col-span-2">
            <div class="mb-2">
              <Button block size="xs" pill variant="secondary" data-testid="btnClearConsole" @click="clearConsole">
                {{ $t("app.buttons.btnClearConsole") }}
              </Button>
            </div>
            <div class="mb-2">
              <Button block size="xs" pill @click="onGetUserInfo">
                {{ $t("app.buttons.btnGetUserInfo") }}
              </Button>
            </div>
            <Card v-if="isDisplay('walletServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
              <div class="text-xl font-bold leading-tight text-left mb-2">Wallet Service</div>
              <Button block size="xs" pill class="mb-2" @click="showWalletUI">
                {{ $t("app.buttons.btnShowWalletUI") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="showWalletConnectScanner">
                {{ $t("app.buttons.btnShowWalletConnectScanner") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="showCheckout">
                {{ $t("app.buttons.btnShowCheckout") }}
              </Button>
            </Card>
            <Card v-if="isDisplay('ethServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
              <div class="text-xl font-bold leading-tight text-left mb-2">Sample Transaction</div>
              <Button block size="xs" pill class="mb-2" @click="onGetAccounts">
                {{ t("app.buttons.btnGetAccounts") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onGetBalance">
                {{ t("app.buttons.btnGetBalance") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onSendEth">{{ t("app.buttons.btnSendEth") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSignEthMessage">{{ t("app.buttons.btnSignEthMessage") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="getConnectedChainId">
                {{ t("app.buttons.btnGetConnectedChainId") }}
              </Button>
            </Card>
            <Card v-if="isDisplay('solServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
              <div class="text-xl font-bold leading-tight text-left mb-2">Sample Transaction</div>
              <Button block size="xs" pill class="mb-2" @click="onAddChain">{{ t("app.buttons.btnAddChain") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSignAndSendTransaction">
                {{ t("app.buttons.btnSignAndSendTransaction") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onSignTransaction">
                {{ t("app.buttons.btnSignTransaction") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onSignMessage">{{ t("app.buttons.btnSignMessage") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSignAllTransactions">
                {{ t("app.buttons.btnSignAllTransactions") }}
              </Button>
            </Card>
          </Card>
          <Card id="console" class="px-4 py-4 col-span-4 overflow-y-auto">
            <pre
              class="whitespace-pre-line overflow-x-auto font-normal text-base leading-6 text-black break-words overflow-y-auto max-h-screen"
            ></pre>
          </Card>
        </div> -->
      </div>
    </div>
  </main>
</template>
